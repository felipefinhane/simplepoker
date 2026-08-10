import { db } from "@/lib/db";
import { tabelaDePontosPadrao } from "@/domain/tabela-de-pontos";
import { registrarEvento } from "@/lib/auditoria";
import type {
  FichaInicial,
  NivelDeBlind,
  ParametrosDaTemporada,
} from "@/domain/types";

/** Uma Temporada, com seus Parâmetros embutidos. Ver CONTEXT.md. */
export interface Temporada {
  id: number;
  aberta: boolean;
  dataInicio: string;
  dataFim: string | null;
  parametros: ParametrosDaTemporada;
}

interface LinhaTemporada {
  id: number;
  aberta: boolean;
  data_inicio: string;
  data_fim: string | null;
  tabela_de_pontos: [number, number][];
  valor_da_partida: string;
  multiplicador_premiacao_primeiro: string;
  multiplicador_premiacao_segundo: string;
  estrutura_de_blinds: NivelDeBlind[];
  fichas_iniciais: FichaInicial[];
}

function linhaParaTemporada(linha: LinhaTemporada): Temporada {
  return {
    id: linha.id,
    aberta: linha.aberta,
    // O driver `pg` devolve colunas timestamptz como Date do JS, apesar
    // do tipo declarado aqui ser string (mesma pegadinha do `date` em
    // Partida — ver src/lib/partidas.ts) — convertendo pra ISO string na
    // borda, uma vez só, em vez de em cada SELECT.
    dataInicio: new Date(linha.data_inicio).toISOString(),
    dataFim: linha.data_fim ? new Date(linha.data_fim).toISOString() : null,
    parametros: {
      tabelaDePontos: new Map(linha.tabela_de_pontos),
      valorDaPartida: Number(linha.valor_da_partida),
      multiplicadorPremiacaoPrimeiro: Number(
        linha.multiplicador_premiacao_primeiro,
      ),
      multiplicadorPremiacaoSegundo: Number(
        linha.multiplicador_premiacao_segundo,
      ),
      estruturaDeBlinds: linha.estrutura_de_blinds,
      fichasIniciais: linha.fichas_iniciais,
    },
  };
}

/**
 * `tabelaDePontos` é um `Map`, que `JSON.stringify` não serializa direito
 * (viraria `{}`) — converte pra um formato seguro pra resposta de API ou
 * pra props de um client component.
 */
export function serializarParametros(parametros: ParametrosDaTemporada) {
  return {
    ...parametros,
    tabelaDePontos: [...parametros.tabelaDePontos.entries()],
  };
}

export function serializarTemporada(temporada: Temporada) {
  return {
    ...temporada,
    parametros: serializarParametros(temporada.parametros),
  };
}

export class JaExisteTemporadaAbertaError extends Error {
  constructor() {
    super("Já existe uma Temporada aberta — encerre-a antes de criar outra.");
    this.name = "JaExisteTemporadaAbertaError";
  }
}

export class TemporadaEncerradaError extends Error {
  constructor() {
    super("Esta Temporada está encerrada e não pode mais ser editada.");
    this.name = "TemporadaEncerradaError";
  }
}

export class ParametrosInvalidosError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ParametrosInvalidosError";
  }
}

function numeroMaiorQueZero(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !(valor > 0)) {
    throw new ParametrosInvalidosError(
      `${campo} precisa ser um número maior que zero.`,
    );
  }
  return valor;
}

function numeroNaoNegativo(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || valor < 0) {
    throw new ParametrosInvalidosError(
      `${campo} precisa ser um número maior ou igual a zero.`,
    );
  }
  return valor;
}

function validarTabelaDePontos(entrada: unknown): Map<number, number> {
  if (!Array.isArray(entrada)) {
    throw new ParametrosInvalidosError(
      "tabelaDePontos precisa ser uma lista de [posição, pontos].",
    );
  }

  const tabela = new Map<number, number>();
  entrada.forEach((item, indice) => {
    if (!Array.isArray(item) || item.length !== 2) {
      throw new ParametrosInvalidosError(
        `tabelaDePontos[${indice}] precisa ser [posição, pontos].`,
      );
    }
    const [posicao, pontos] = item;
    if (!Number.isInteger(posicao) || posicao < 1) {
      throw new ParametrosInvalidosError(
        `Posição inválida em tabelaDePontos[${indice}].`,
      );
    }
    tabela.set(posicao, numeroNaoNegativo(pontos, `tabelaDePontos[${indice}].pontos`));
  });

  return tabela;
}

function validarEstruturaDeBlinds(entrada: unknown): NivelDeBlind[] {
  if (!Array.isArray(entrada)) {
    throw new ParametrosInvalidosError("estruturaDeBlinds precisa ser uma lista.");
  }

  return entrada.map((nivel, indice) => {
    if (typeof nivel !== "object" || nivel === null) {
      throw new ParametrosInvalidosError(
        `estruturaDeBlinds[${indice}] inválido.`,
      );
    }
    const n = nivel as Record<string, unknown>;
    return {
      blindPequeno: numeroMaiorQueZero(
        n.blindPequeno,
        `estruturaDeBlinds[${indice}].blindPequeno`,
      ),
      blindGrande: numeroMaiorQueZero(
        n.blindGrande,
        `estruturaDeBlinds[${indice}].blindGrande`,
      ),
      duracaoMinutos: numeroMaiorQueZero(
        n.duracaoMinutos,
        `estruturaDeBlinds[${indice}].duracaoMinutos`,
      ),
    };
  });
}

function validarFichasIniciais(entrada: unknown): FichaInicial[] {
  if (!Array.isArray(entrada)) {
    throw new ParametrosInvalidosError("fichasIniciais precisa ser uma lista.");
  }

  return entrada.map((ficha, indice) => {
    if (typeof ficha !== "object" || ficha === null) {
      throw new ParametrosInvalidosError(`fichasIniciais[${indice}] inválida.`);
    }
    const f = ficha as Record<string, unknown>;
    return {
      valor: numeroMaiorQueZero(f.valor, `fichasIniciais[${indice}].valor`),
      quantidade: numeroMaiorQueZero(
        f.quantidade,
        `fichasIniciais[${indice}].quantidade`,
      ),
    };
  });
}

/** Valida um corpo de requisição como Parâmetros da Temporada completos. */
export function validarParametros(entrada: unknown): ParametrosDaTemporada {
  if (typeof entrada !== "object" || entrada === null) {
    throw new ParametrosInvalidosError("Parâmetros inválidos.");
  }
  const p = entrada as Record<string, unknown>;

  return {
    tabelaDePontos: validarTabelaDePontos(p.tabelaDePontos),
    valorDaPartida: numeroMaiorQueZero(p.valorDaPartida, "valorDaPartida"),
    multiplicadorPremiacaoPrimeiro: numeroNaoNegativo(
      p.multiplicadorPremiacaoPrimeiro,
      "multiplicadorPremiacaoPrimeiro",
    ),
    multiplicadorPremiacaoSegundo: numeroNaoNegativo(
      p.multiplicadorPremiacaoSegundo,
      "multiplicadorPremiacaoSegundo",
    ),
    estruturaDeBlinds: validarEstruturaDeBlinds(p.estruturaDeBlinds),
    fichasIniciais: validarFichasIniciais(p.fichasIniciais),
  };
}

/**
 * Parâmetros padrão pra pré-preencher o formulário de nova Temporada: os
 * da Temporada mais recente (aberta ou não), ou — na primeira vez — os
 * valores confirmados com o Organizador, vindos de POKER 1_2026.xlsx.
 * Estrutura de Blinds e Fichas Iniciais não tiveram valores reais
 * confirmados ainda, então começam vazias, editáveis pelo Organizador.
 */
export async function obterParametrosPadraoParaNovaTemporada(): Promise<ParametrosDaTemporada> {
  const { rows } = await db.query<LinhaTemporada>(
    `SELECT * FROM temporadas ORDER BY id DESC LIMIT 1`,
  );

  if (rows[0]) {
    return linhaParaTemporada(rows[0]).parametros;
  }

  return {
    tabelaDePontos: tabelaDePontosPadrao,
    valorDaPartida: 10,
    multiplicadorPremiacaoPrimeiro: 2,
    multiplicadorPremiacaoSegundo: 1,
    estruturaDeBlinds: [],
    fichasIniciais: [],
  };
}

export async function buscarTemporadaAberta(): Promise<Temporada | null> {
  const { rows } = await db.query<LinhaTemporada>(
    `SELECT * FROM temporadas WHERE aberta = true LIMIT 1`,
  );
  return rows[0] ? linhaParaTemporada(rows[0]) : null;
}

export async function buscarTemporadaPorId(id: number): Promise<Temporada | null> {
  const { rows } = await db.query<LinhaTemporada>(
    `SELECT * FROM temporadas WHERE id = $1`,
    [id],
  );
  return rows[0] ? linhaParaTemporada(rows[0]) : null;
}

/** Temporadas mais recentes primeiro — usado pro histórico (ticket 07). */
export async function listarTemporadas(): Promise<Temporada[]> {
  const { rows } = await db.query<LinhaTemporada>(
    `SELECT * FROM temporadas ORDER BY id DESC`,
  );
  return rows.map(linhaParaTemporada);
}

/**
 * Temporadas encerradas, mais recentes primeiro — a lista de `/historico`.
 * Ordena por `data_inicio` (não por `id`): a ordem de criação da linha no
 * banco não bate com a ordem cronológica real quando Temporadas antigas
 * são importadas fora de ordem (ver tickets 24/27/28).
 */
export async function listarTemporadasEncerradas(): Promise<Temporada[]> {
  const { rows } = await db.query<LinhaTemporada>(
    `SELECT * FROM temporadas WHERE aberta = false ORDER BY data_inicio DESC`,
  );
  return rows.map(linhaParaTemporada);
}

function parametrosParaColunas(parametros: ParametrosDaTemporada): unknown[] {
  return [
    JSON.stringify([...parametros.tabelaDePontos.entries()]),
    parametros.valorDaPartida,
    parametros.multiplicadorPremiacaoPrimeiro,
    parametros.multiplicadorPremiacaoSegundo,
    JSON.stringify(parametros.estruturaDeBlinds),
    JSON.stringify(parametros.fichasIniciais),
  ];
}

/** Código do Postgres para violação de constraint única (unique_violation). */
const PG_UNIQUE_VIOLATION = "23505";

function ehViolacaoDeUnicidade(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

/**
 * Cria uma nova Temporada. Lança `JaExisteTemporadaAbertaError` se já
 * houver uma aberta. A checagem acima do INSERT cobre o caso comum, mas
 * duas criações concorrentes poderiam passar por ela ao mesmo tempo — por
 * isso o índice único do banco (ver migration) é a trava que realmente
 * garante a regra, e uma violação dele aqui também vira
 * `JaExisteTemporadaAbertaError` em vez de estourar como erro genérico.
 */
export async function criarTemporada(
  parametrosBrutos: unknown,
  atorId: number | null,
): Promise<Temporada> {
  const jaAberta = await buscarTemporadaAberta();
  if (jaAberta) throw new JaExisteTemporadaAbertaError();

  const parametros = validarParametros(parametrosBrutos);

  let rows: LinhaTemporada[];
  try {
    ({ rows } = await db.query<LinhaTemporada>(
      `INSERT INTO temporadas (
         tabela_de_pontos, valor_da_partida,
         multiplicador_premiacao_primeiro, multiplicador_premiacao_segundo,
         estrutura_de_blinds, fichas_iniciais, criado_por_jogador_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [...parametrosParaColunas(parametros), atorId],
    ));
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) throw new JaExisteTemporadaAbertaError();
    throw error;
  }

  return linhaParaTemporada(rows[0]);
}

/**
 * Edita os Parâmetros de uma Temporada. Retorna null se o id não existir;
 * lança `TemporadaEncerradaError` se ela já estiver encerrada.
 */
export async function editarParametrosDaTemporada(
  id: number,
  parametrosBrutos: unknown,
  atorId: number | null,
): Promise<Temporada | null> {
  const atual = await buscarTemporadaPorId(id);
  if (!atual) return null;
  if (!atual.aberta) throw new TemporadaEncerradaError();

  const parametros = validarParametros(parametrosBrutos);

  const { rows } = await db.query<LinhaTemporada>(
    `UPDATE temporadas
     SET tabela_de_pontos = $2, valor_da_partida = $3,
         multiplicador_premiacao_primeiro = $4,
         multiplicador_premiacao_segundo = $5,
         estrutura_de_blinds = $6, fichas_iniciais = $7,
         atualizado_por_jogador_id = $8, atualizado_em = now()
     WHERE id = $1
     RETURNING *`,
    [id, ...parametrosParaColunas(parametros), atorId],
  );

  // Parâmetros de verdade editados (Tabela de Pontos, Blinds, etc.) — ação
  // sensível, mexe em como toda a Temporada é calculada. Ver ticket 44.
  await registrarEvento(null, {
    jogadorId: atorId,
    acao: "temporada.parametros_atualizados",
    entidadeTipo: "temporada",
    entidadeId: id,
    dadosAntes: serializarParametros(atual.parametros),
    dadosDepois: serializarParametros(parametros),
  });

  return linhaParaTemporada(rows[0]);
}

/**
 * Encerra uma Temporada aberta, congelando seus dados. Retorna null se o
 * id não existir; lança `TemporadaEncerradaError` se já estiver encerrada.
 */
export async function encerrarTemporada(
  id: number,
  atorId: number | null,
): Promise<Temporada | null> {
  const atual = await buscarTemporadaPorId(id);
  if (!atual) return null;
  if (!atual.aberta) throw new TemporadaEncerradaError();

  const { rows } = await db.query<LinhaTemporada>(
    `UPDATE temporadas
     SET aberta = false, data_fim = now(),
         atualizado_por_jogador_id = $2, atualizado_em = now()
     WHERE id = $1 RETURNING *`,
    [id, atorId],
  );

  // Irreversível — congela a Temporada de vez. Ver ticket 44.
  await registrarEvento(null, {
    jogadorId: atorId,
    acao: "temporada.encerrada",
    entidadeTipo: "temporada",
    entidadeId: id,
  });

  return linhaParaTemporada(rows[0]);
}
