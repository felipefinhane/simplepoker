import { db, withTransaction } from "@/lib/db";
import { calcularPontosDoLancamento } from "@/domain/pontos";
import {
  calcularEntradaNoCaixa,
  calcularPremiacaoDaPartida,
  type PremiacaoDaPartida,
} from "@/domain/caixa";
import {
  TemporadaEncerradaError,
  buscarTemporadaAberta,
  buscarTemporadaPorId,
} from "@/lib/temporadas";
import { listarJogadoresAtivos } from "@/lib/jogadores";

/** Ver CONTEXT.md — Partida exige no mínimo 5 participantes. */
export const MINIMO_DE_PARTICIPANTES = 5;

/** Um Lançamento de um Jogador numa Partida, já com Pontos derivados. Ver CONTEXT.md. */
export interface LancamentoDaPartida {
  jogadorId: number;
  nome: string;
  posicao: number | null;
  almas: number;
  pagamento: boolean;
  /** Derivado (posicao + almas); null enquanto o Lançamento não foi feito. */
  pontos: number | null;
}

export interface Partida {
  id: number;
  temporadaId: number;
  data: string;
  lancamentos: LancamentoDaPartida[];
}

/**
 * Uma Partida está "lançada" quando todo participante tem Posição — como
 * lançar resultado é atômico (ou lança todos, ou nenhum), isso nunca fica
 * parcialmente verdadeiro.
 */
export function partidaEstaLancada(partida: Partida): boolean {
  return partida.lancamentos.every((l) => l.posicao !== null);
}

export class NenhumaTemporadaAbertaError extends Error {
  constructor() {
    super("Não há Temporada aberta para criar uma Partida.");
    this.name = "NenhumaTemporadaAbertaError";
  }
}

export class MinimoDeParticipantesError extends Error {
  constructor() {
    super(
      `Uma Partida precisa de no mínimo ${MINIMO_DE_PARTICIPANTES} participantes.`,
    );
    this.name = "MinimoDeParticipantesError";
  }
}

export class JogadorInvalidoError extends Error {
  constructor(jogadorId: number) {
    super(`Jogador ${jogadorId} não existe ou está desativado.`);
    this.name = "JogadorInvalidoError";
  }
}

export class LancamentosInvalidosError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "LancamentosInvalidosError";
  }
}

/**
 * Cria uma Partida vinculada à Temporada aberta, com um Lançamento vazio
 * (sem posicao/almas/pagamento) por participante — "vazio" é o estado
 * "convocado, ainda não lançado".
 */
export async function criarPartida(
  data: string,
  jogadorIdsBrutos: number[],
): Promise<Partida> {
  // Ids duplicados não deveriam acontecer vindo da UI (checkboxes), mas
  // se vierem, contam como um participante só — evita um erro cru de
  // violação de unicidade no banco por causa de um dado que a UI nunca
  // deveria mandar mas a API não devia deixar quebrar feio.
  const jogadorIds = [...new Set(jogadorIdsBrutos)];

  if (jogadorIds.length < MINIMO_DE_PARTICIPANTES) {
    throw new MinimoDeParticipantesError();
  }

  const temporada = await buscarTemporadaAberta();
  if (!temporada) throw new NenhumaTemporadaAbertaError();

  const ativos = await listarJogadoresAtivos();
  const idsAtivos = new Set(ativos.map((j) => j.id));
  for (const jogadorId of jogadorIds) {
    if (!idsAtivos.has(jogadorId)) throw new JogadorInvalidoError(jogadorId);
  }

  const partidaId = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO partidas (temporada_id, data) VALUES ($1, $2) RETURNING id`,
      [temporada.id, data],
    );
    const id = rows[0].id;

    for (const jogadorId of jogadorIds) {
      await client.query(
        `INSERT INTO lancamentos (partida_id, jogador_id) VALUES ($1, $2)`,
        [id, jogadorId],
      );
    }

    return id;
  });

  // A Partida acabou de ser criada por esta mesma função — sempre existe.
  return (await buscarPartidaPorId(partidaId))!;
}

interface LinhaLancamento {
  jogador_id: number;
  nome: string;
  posicao: number | null;
  almas: number;
  pagamento: boolean;
}

export async function buscarPartidaPorId(id: number): Promise<Partida | null> {
  // `to_char` evita que o driver devolva `data` como Date do JS (o tipo
  // `date` do Postgres, sem isso, vem como objeto Date, não string).
  const { rows: partidaRows } = await db.query<{
    id: number;
    temporada_id: number;
    data: string;
  }>(
    `SELECT id, temporada_id, to_char(data, 'YYYY-MM-DD') AS data FROM partidas WHERE id = $1`,
    [id],
  );

  const partidaRow = partidaRows[0];
  if (!partidaRow) return null;

  const temporada = await buscarTemporadaPorId(partidaRow.temporada_id);
  // A Temporada é referenciada por FK (ON DELETE RESTRICT) — sempre existe.
  const tabelaDePontos = temporada!.parametros.tabelaDePontos;

  const { rows: lancamentoRows } = await db.query<LinhaLancamento>(
    `SELECT l.jogador_id, j.nome, l.posicao, l.almas, l.pagamento
     FROM lancamentos l
     JOIN jogadores j ON j.id = l.jogador_id
     WHERE l.partida_id = $1
     ORDER BY j.nome`,
    [id],
  );

  const lancamentos: LancamentoDaPartida[] = lancamentoRows.map((linha) => ({
    jogadorId: linha.jogador_id,
    nome: linha.nome,
    posicao: linha.posicao,
    almas: linha.almas,
    pagamento: linha.pagamento,
    pontos:
      linha.posicao === null
        ? null
        : calcularPontosDoLancamento(
            { posicao: linha.posicao, almas: linha.almas },
            tabelaDePontos,
          ),
  }));

  return {
    id: partidaRow.id,
    temporadaId: partidaRow.temporada_id,
    data: partidaRow.data,
    lancamentos,
  };
}

/**
 * Partidas mais recentes primeiro. Faz uma consulta por Partida (via
 * `buscarPartidaPorId`) em vez de uma única consulta agregada — simples e
 * suficiente pro volume de uso (um grupo de amigos, algumas dezenas de
 * Partidas por Temporada); revisitar se algum dia isso virar um gargalo
 * de verdade.
 */
export async function listarPartidas(): Promise<Partida[]> {
  const { rows } = await db.query<{ id: number }>(
    `SELECT id FROM partidas ORDER BY data DESC, id DESC`,
  );
  const partidas = await Promise.all(rows.map((r) => buscarPartidaPorId(r.id)));
  return partidas.filter((p): p is Partida => p !== null);
}

/** Partidas de uma Temporada específica, mais recentes primeiro. */
export async function listarPartidasDaTemporada(
  temporadaId: number,
): Promise<Partida[]> {
  const { rows } = await db.query<{ id: number }>(
    `SELECT id FROM partidas WHERE temporada_id = $1 ORDER BY data DESC, id DESC`,
    [temporadaId],
  );
  const partidas = await Promise.all(rows.map((r) => buscarPartidaPorId(r.id)));
  return partidas.filter((p): p is Partida => p !== null);
}

export interface EntradaDeLancamento {
  jogadorId: number;
  posicao: number;
  almas: number;
  pagamento: boolean;
}

export interface ResultadoLancado {
  partida: Partida;
  premiacao: PremiacaoDaPartida;
  entradaNoCaixa: number;
}

/**
 * Lança (ou reedita) o resultado completo de uma Partida — todos os
 * participantes de uma vez, nunca parcial. Recalcula Pontos, Premiação da
 * Partida e a entrada automática no Caixa (que substitui a anterior, se
 * já existia — ver índice único em caixa_transacoes).
 */
export async function lancarResultado(
  partidaId: number,
  entradas: EntradaDeLancamento[],
): Promise<ResultadoLancado | null> {
  const partida = await buscarPartidaPorId(partidaId);
  if (!partida) return null;

  const temporada = await buscarTemporadaPorId(partida.temporadaId);
  if (!temporada) return null; // não deveria acontecer (FK)

  const idsEsperados = new Set(partida.lancamentos.map((l) => l.jogadorId));
  const idsRecebidos = new Set(entradas.map((e) => e.jogadorId));
  const mesmoConjunto =
    idsEsperados.size === idsRecebidos.size &&
    [...idsEsperados].every((id) => idsRecebidos.has(id));
  if (!mesmoConjunto) {
    throw new LancamentosInvalidosError(
      "É preciso informar o resultado de todos (e só) os participantes da Partida.",
    );
  }

  for (const entrada of entradas) {
    if (!Number.isInteger(entrada.posicao) || entrada.posicao < 1) {
      throw new LancamentosInvalidosError(
        `Posição inválida para o jogador ${entrada.jogadorId}.`,
      );
    }
    if (!Number.isInteger(entrada.almas) || entrada.almas < 0) {
      throw new LancamentosInvalidosError(
        `Número de almas inválido para o jogador ${entrada.jogadorId}.`,
      );
    }
  }

  const premiacao = calcularPremiacaoDaPartida(temporada.parametros);
  const entradaNoCaixa = calcularEntradaNoCaixa(
    entradas.length,
    temporada.parametros,
  );

  await withTransaction(async (client) => {
    // `FOR UPDATE` trava a linha da Temporada até o fim da transação: se
    // `encerrarTemporada` estiver rodando ao mesmo tempo, uma das duas
    // espera a outra terminar — sem isso, checar "está aberta?" e gravar
    // o lançamento são dois passos separados que uma corrida poderia
    // intercalar, deixando um lançamento gravado numa Temporada que acabou
    // de ser encerrada (a mesma classe de corrida corrigida no ticket 05
    // para "duas Temporadas abertas").
    const { rows } = await client.query<{ aberta: boolean }>(
      `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
      [temporada.id],
    );
    if (!rows[0]?.aberta) throw new TemporadaEncerradaError();

    for (const entrada of entradas) {
      await client.query(
        `UPDATE lancamentos
         SET posicao = $3, almas = $4, pagamento = $5
         WHERE partida_id = $1 AND jogador_id = $2`,
        [partidaId, entrada.jogadorId, entrada.posicao, entrada.almas, entrada.pagamento],
      );
    }

    await client.query(
      `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, partida_id)
       VALUES ($1, 'entrada_partida', $2, $3)
       ON CONFLICT (partida_id) WHERE tipo = 'entrada_partida'
       DO UPDATE SET valor = EXCLUDED.valor`,
      [temporada.id, entradaNoCaixa, partidaId],
    );
  });

  const partidaAtualizada = (await buscarPartidaPorId(partidaId))!;

  return { partida: partidaAtualizada, premiacao, entradaNoCaixa };
}
