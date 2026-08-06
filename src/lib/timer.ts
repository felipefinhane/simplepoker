import { NextResponse } from "next/server";
import { db, withTransaction } from "@/lib/db";
import { buscarPartidaPorId } from "@/lib/partidas";
import { TemporadaEncerradaError, buscarTemporadaPorId } from "@/lib/temporadas";
import type { NivelDeBlind } from "@/domain/types";

/** Estado do Timer de blinds de uma Partida. Ver CONTEXT.md (Estrutura de Blinds). */
export interface EstadoDoTimer {
  partidaId: number;
  nivel: number;
  totalDeNiveis: number;
  rodando: boolean;
  segundosRestantes: number;
  nivelAtual: NivelDeBlind | null;
  proximoNivel: NivelDeBlind | null;
}

export class SemEstruturaDeBlindsError extends Error {
  constructor() {
    super("A Temporada desta Partida não tem Estrutura de Blinds configurada.");
    this.name = "SemEstruturaDeBlindsError";
  }
}

export class UltimoNivelError extends Error {
  constructor() {
    super("Já está no último nível de blinds.");
    this.name = "UltimoNivelError";
  }
}

export class TimerNaoIniciadoError extends Error {
  constructor() {
    super("Inicie o Timer antes de pular de nível.");
    this.name = "TimerNaoIniciadoError";
  }
}

interface LinhaTimer {
  nivel: number;
  rodando: boolean;
  inicio_do_nivel: string | Date | null;
  segundos_decorridos: number;
}

interface Contexto {
  temporadaId: number;
  temporadaAberta: boolean;
  estruturaDeBlinds: NivelDeBlind[];
}

async function obterContexto(partidaId: number): Promise<Contexto | null> {
  const partida = await buscarPartidaPorId(partidaId);
  if (!partida) return null;
  const temporada = await buscarTemporadaPorId(partida.temporadaId);
  if (!temporada) return null;
  return {
    temporadaId: temporada.id,
    temporadaAberta: temporada.aberta,
    estruturaDeBlinds: temporada.parametros.estruturaDeBlinds,
  };
}

function montarEstado(
  partidaId: number,
  linha: LinhaTimer | undefined,
  estruturaDeBlinds: NivelDeBlind[],
): EstadoDoTimer {
  const nivel = linha?.nivel ?? 0;
  const rodando = linha?.rodando ?? false;
  const nivelAtual = estruturaDeBlinds[nivel] ?? null;
  const duracaoTotalEmSegundos = nivelAtual ? nivelAtual.duracaoMinutos * 60 : 0;

  let segundosDecorridos = linha?.segundos_decorridos ?? 0;
  if (rodando && linha?.inicio_do_nivel) {
    const decorridoDesdeInicio = Math.floor(
      (Date.now() - new Date(linha.inicio_do_nivel).getTime()) / 1000,
    );
    segundosDecorridos += Math.max(0, decorridoDesdeInicio);
  }

  return {
    partidaId,
    nivel,
    totalDeNiveis: estruturaDeBlinds.length,
    rodando,
    segundosRestantes: Math.max(0, duracaoTotalEmSegundos - segundosDecorridos),
    nivelAtual,
    proximoNivel: estruturaDeBlinds[nivel + 1] ?? null,
  };
}

/** Estado atual do Timer — usado tanto por quem controla quanto por quem só assiste. */
export async function buscarEstadoDoTimer(
  partidaId: number,
): Promise<EstadoDoTimer | null> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) return null;

  const { rows } = await db.query<LinhaTimer>(
    `SELECT nivel, rodando, inicio_do_nivel, segundos_decorridos
     FROM timers_de_partida WHERE partida_id = $1`,
    [partidaId],
  );

  return montarEstado(partidaId, rows[0], contexto.estruturaDeBlinds);
}

/**
 * Inicia (ou retoma, se pausado) o Timer no nível atual. Chamado de novo
 * enquanto já roda não reinicia a contagem (idempotente).
 */
export async function iniciarTimer(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (contexto.estruturaDeBlinds.length === 0) throw new SemEstruturaDeBlindsError();

  await withTransaction(async (client) => {
    // `FOR UPDATE`: mesma trava usada em lancarResultado/lancarSaidaManual,
    // pra não deixar controlar o timer de uma Temporada que acabou de
    // encerrar no meio da chamada.
    const { rows } = await client.query<{ aberta: boolean }>(
      `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
      [contexto.temporadaId],
    );
    if (!rows[0]?.aberta) throw new TemporadaEncerradaError();

    await client.query(
      `INSERT INTO timers_de_partida (partida_id, nivel, rodando, inicio_do_nivel, segundos_decorridos)
       VALUES ($1, 0, true, now(), 0)
       ON CONFLICT (partida_id) DO UPDATE
       SET rodando = true, inicio_do_nivel = now()
       WHERE NOT timers_de_partida.rodando`,
      [partidaId],
    );
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/** Pausa o Timer, congelando o tempo já decorrido no nível atual. */
export async function pausarTimer(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);

  await withTransaction(async (client) => {
    const { rows } = await client.query<{ aberta: boolean }>(
      `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
      [contexto.temporadaId],
    );
    if (!rows[0]?.aberta) throw new TemporadaEncerradaError();

    // O cálculo do tempo decorrido acontece dentro do próprio UPDATE (SQL),
    // não em JS — evita uma corrida entre ler o estado e gravar de volta.
    await client.query(
      `UPDATE timers_de_partida
       SET segundos_decorridos = segundos_decorridos
             + GREATEST(0, EXTRACT(EPOCH FROM (now() - inicio_do_nivel))::integer),
           rodando = false,
           inicio_do_nivel = NULL
       WHERE partida_id = $1 AND rodando`,
      [partidaId],
    );
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/**
 * Avança pro próximo nível de blinds, zerando o tempo decorrido. Mantém
 * rodando/pausado como estava. Lança `UltimoNivelError` se já estiver no
 * último nível da Estrutura de Blinds.
 */
export async function pularNivel(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (contexto.estruturaDeBlinds.length === 0) throw new SemEstruturaDeBlindsError();

  await withTransaction(async (client) => {
    const { rows: temporadaRows } = await client.query<{ aberta: boolean }>(
      `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
      [contexto.temporadaId],
    );
    if (!temporadaRows[0]?.aberta) throw new TemporadaEncerradaError();

    const { rows } = await client.query<{ nivel: number; rodando: boolean }>(
      `SELECT nivel, rodando FROM timers_de_partida WHERE partida_id = $1 FOR UPDATE`,
      [partidaId],
    );
    // Sem linha = timer nunca foi iniciado. Diferente de iniciar/pausar
    // (onde "nunca iniciado" tem um estado padrão razoável), pular nível
    // antes de iniciar deixaria o nível 0 sem nunca ter rodado — melhor
    // recusar do que criar esse estado esquisito silenciosamente.
    if (!rows[0]) throw new TimerNaoIniciadoError();

    const { nivel: nivelAtual } = rows[0];
    if (nivelAtual + 1 >= contexto.estruturaDeBlinds.length) {
      throw new UltimoNivelError();
    }

    await client.query(
      `UPDATE timers_de_partida
       SET nivel = $2,
           inicio_do_nivel = CASE WHEN rodando THEN now() ELSE NULL END,
           segundos_decorridos = 0
       WHERE partida_id = $1`,
      [partidaId, nivelAtual + 1],
    );
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/**
 * Converte os erros de domínio do Timer numa resposta HTTP — usada pelas
 * três rotas de controle (iniciar/pausar/pular-nivel), que só diferem na
 * função chamada. Retorna null se o erro não for um dos esperados (a
 * rota deve relançar nesse caso).
 */
export function respostaDeErroDoTimer(error: unknown): NextResponse | null {
  if (
    error instanceof TemporadaEncerradaError ||
    error instanceof SemEstruturaDeBlindsError ||
    error instanceof UltimoNivelError ||
    error instanceof TimerNaoIniciadoError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  return null;
}
