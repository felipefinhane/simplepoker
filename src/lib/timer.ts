import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { db, withTransaction } from "@/lib/db";
import { buscarPartidaPorId } from "@/lib/partidas";
import { TemporadaEncerradaError, buscarTemporadaPorId } from "@/lib/temporadas";
import type { NivelDeBlind } from "@/domain/types";

/** Estado do Timer de blinds de uma Partida. Ver CONTEXT.md (Timer). */
export interface EstadoDoTimer {
  partidaId: number;
  nivel: number;
  totalDeNiveis: number;
  rodando: boolean;
  /** Ver `encerrarTimer` — uma vez true, nenhum outro controle funciona mais. */
  encerrado: boolean;
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

export class PrimeiroNivelError extends Error {
  constructor() {
    super("Já está no primeiro nível de blinds.");
    this.name = "PrimeiroNivelError";
  }
}

export class TimerNaoIniciadoError extends Error {
  constructor() {
    super("Inicie o Timer antes de pular ou voltar de nível.");
    this.name = "TimerNaoIniciadoError";
  }
}

export class TimerEncerradoError extends Error {
  constructor() {
    super("Este Timer foi encerrado e não pode mais ser controlado.");
    this.name = "TimerEncerradoError";
  }
}

interface LinhaTimer {
  nivel: number;
  rodando: boolean;
  encerrado: boolean;
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
    encerrado: linha?.encerrado ?? false,
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
    `SELECT nivel, rodando, encerrado, inicio_do_nivel, segundos_decorridos
     FROM timers_de_partida WHERE partida_id = $1`,
    [partidaId],
  );

  return montarEstado(partidaId, rows[0], contexto.estruturaDeBlinds);
}

/**
 * Trava a linha da Temporada (mesma técnica usada em toda edição
 * concorrente deste app — ver `finalizarPartida`/`lancarSaidaManual`),
 * único lugar que faz essa checagem — todo controle do Timer passa por
 * aqui, direto ou indiretamente (via `mudarNivel`).
 */
async function travarTemporada(client: PoolClient, temporadaId: number): Promise<void> {
  const { rows } = await client.query<{ aberta: boolean }>(
    `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
    [temporadaId],
  );
  if (!rows[0]?.aberta) throw new TemporadaEncerradaError();
}

/**
 * `travarTemporada` + recusa se o Timer já tiver sido encerrado — usada
 * pelos controles que não precisam ler mais nada da linha do Timer
 * (`iniciarTimer`/`pausarTimer`/`reiniciarTimer`). `mudarNivel` e
 * `encerrarTimer` fazem sua própria leitura da linha (precisam de mais
 * colunas, ou não se importam com o valor de `encerrado`), então só usam
 * `travarTemporada` direto.
 */
async function travarTemporadaEControleDoTimer(
  client: PoolClient,
  partidaId: number,
  temporadaId: number,
): Promise<void> {
  await travarTemporada(client, temporadaId);

  const { rows: timerRows } = await client.query<{ encerrado: boolean }>(
    `SELECT encerrado FROM timers_de_partida WHERE partida_id = $1 FOR UPDATE`,
    [partidaId],
  );
  if (timerRows[0]?.encerrado) throw new TimerEncerradoError();
}

/**
 * Grava o Timer zerado (nível 0, parado, tempo cheio) — compartilhado por
 * `reiniciarTimer` (`encerrado = false`) e `encerrarTimer`
 * (`encerrado = true`), que só diferem nisso.
 */
async function zerarLinhaDoTimer(
  client: PoolClient,
  partidaId: number,
  encerrado: boolean,
): Promise<void> {
  await client.query(
    `INSERT INTO timers_de_partida (partida_id, nivel, rodando, inicio_do_nivel, segundos_decorridos, encerrado)
     VALUES ($1, 0, false, NULL, 0, $2)
     ON CONFLICT (partida_id) DO UPDATE
     SET nivel = 0, rodando = false, inicio_do_nivel = NULL, segundos_decorridos = 0, encerrado = $2`,
    [partidaId, encerrado],
  );
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
    await travarTemporadaEControleDoTimer(client, partidaId, contexto.temporadaId);

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
    await travarTemporadaEControleDoTimer(client, partidaId, contexto.temporadaId);

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
 * Muda de nível (+1 pra `pularNivel`, -1 pra `voltarNivel`), zerando o
 * tempo decorrido e mantendo rodando/pausado como estava. `erroDeLimite`
 * decide qual erro lançar quando o novo nível ficaria fora da Estrutura
 * de Blinds (antes do primeiro ou depois do último).
 */
async function mudarNivel(
  partidaId: number,
  contexto: Contexto,
  delta: 1 | -1,
  erroDeLimite: () => Error,
): Promise<EstadoDoTimer> {
  await withTransaction(async (client) => {
    await travarTemporada(client, contexto.temporadaId);

    const { rows } = await client.query<{ nivel: number; rodando: boolean; encerrado: boolean }>(
      `SELECT nivel, rodando, encerrado FROM timers_de_partida WHERE partida_id = $1 FOR UPDATE`,
      [partidaId],
    );
    // Sem linha = timer nunca foi iniciado. Diferente de iniciar/pausar
    // (onde "nunca iniciado" tem um estado padrão razoável), mudar de
    // nível antes de iniciar deixaria o nível 0 sem nunca ter rodado —
    // melhor recusar do que criar esse estado esquisito silenciosamente.
    if (!rows[0]) throw new TimerNaoIniciadoError();
    if (rows[0].encerrado) throw new TimerEncerradoError();

    const novoNivel = rows[0].nivel + delta;
    if (novoNivel < 0 || novoNivel >= contexto.estruturaDeBlinds.length) {
      throw erroDeLimite();
    }

    await client.query(
      `UPDATE timers_de_partida
       SET nivel = $2,
           inicio_do_nivel = CASE WHEN rodando THEN now() ELSE NULL END,
           segundos_decorridos = 0
       WHERE partida_id = $1`,
      [partidaId, novoNivel],
    );
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/**
 * Avança pro próximo nível de blinds. Lança `UltimoNivelError` se já
 * estiver no último nível da Estrutura de Blinds.
 */
export async function pularNivel(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (contexto.estruturaDeBlinds.length === 0) throw new SemEstruturaDeBlindsError();

  return mudarNivel(partidaId, contexto, 1, () => new UltimoNivelError());
}

/**
 * Volta pro nível anterior de blinds (oposto de `pularNivel`). Lança
 * `PrimeiroNivelError` se já estiver no primeiro nível.
 */
export async function voltarNivel(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (contexto.estruturaDeBlinds.length === 0) throw new SemEstruturaDeBlindsError();

  return mudarNivel(partidaId, contexto, -1, () => new PrimeiroNivelError());
}

/**
 * Volta o Timer pro nível 0 com o tempo cheio, pausado — continua
 * controlável depois (diferente de `encerrarTimer`, que também zera mas
 * trava). Útil pra corrigir um Timer iniciado por engano ou recomeçar a
 * contagem de uma Partida que teve uma pausa longa fora do app.
 */
export async function reiniciarTimer(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (contexto.estruturaDeBlinds.length === 0) throw new SemEstruturaDeBlindsError();

  await withTransaction(async (client) => {
    await travarTemporadaEControleDoTimer(client, partidaId, contexto.temporadaId);
    await zerarLinhaDoTimer(client, partidaId, false);
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/**
 * Zera o Timer (nível 0, tempo cheio, parado) e trava: depois disso,
 * nenhum outro controle (iniciar/pausar/pular ou voltar nível/reiniciar)
 * funciona mais nesta Partida. Não existe "reabrir" — é definitivo, igual
 * a `finalizarPartida`/`encerrarTemporada`. Não exige Estrutura de Blinds
 * configurada (diferente dos demais controles) — travar um Timer é válido
 * mesmo numa Temporada que nunca teve um Timer de fato utilizável.
 */
export async function encerrarTimer(partidaId: number): Promise<EstadoDoTimer> {
  const contexto = await obterContexto(partidaId);
  if (!contexto) throw new Error(`Partida ${partidaId} não encontrada.`);

  await withTransaction(async (client) => {
    await travarTemporada(client, contexto.temporadaId);
    await zerarLinhaDoTimer(client, partidaId, true);
  });

  return (await buscarEstadoDoTimer(partidaId))!;
}

/**
 * Converte os erros de domínio do Timer numa resposta HTTP — usada pelas
 * rotas de controle (iniciar/pausar/pular-nivel/voltar-nivel/reiniciar/
 * encerrar), que só diferem na função chamada. Retorna null se o erro não
 * for um dos esperados (a rota deve relançar nesse caso).
 */
export function respostaDeErroDoTimer(error: unknown): NextResponse | null {
  if (
    error instanceof TemporadaEncerradaError ||
    error instanceof SemEstruturaDeBlindsError ||
    error instanceof UltimoNivelError ||
    error instanceof PrimeiroNivelError ||
    error instanceof TimerNaoIniciadoError ||
    error instanceof TimerEncerradoError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  return null;
}
