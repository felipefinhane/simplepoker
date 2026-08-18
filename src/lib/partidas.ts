import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { db, withTransaction } from "@/lib/db";
import { calcularAlmas } from "@/domain/alma";
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
import { registrarEvento } from "@/lib/auditoria";
import { notificarJogadorSaiu, notificarPartidaTerminou } from "@/lib/push";

/** Ver CONTEXT.md — Partida exige no mínimo 5 participantes. */
export const MINIMO_DE_PARTICIPANTES = 5;

/**
 * Um Lançamento de um Jogador numa Partida, já com Almas e Pontos
 * derivados. Ver CONTEXT.md.
 */
export interface LancamentoDaPartida {
  jogadorId: number;
  nome: string;
  posicao: number | null;
  eliminadoPorJogadorId: number | null;
  eliminadoPorNome: string | null;
  pagamento: boolean;
  /**
   * Derivado: quantos Jogadores este eliminou nesta Partida, + 1 se
   * terminou em 1º ou 2º lugar (guardou a própria alma). Ver CONTEXT.md.
   */
  almas: number;
  /** Derivado (Posição + Almas); null enquanto ele ainda está ativo. */
  pontos: number | null;
}

export interface Partida {
  id: number;
  temporadaId: number;
  data: string;
  finalizada: boolean;
  lancamentos: LancamentoDaPartida[];
}

/** O que pode ser alterado num Lançamento existente — ver `atualizarLancamento`. */
export interface AtualizacaoDeLancamento {
  posicao?: number | null;
  eliminadoPorJogadorId?: number | null;
  pagamento?: boolean;
}

/**
 * Se a Partida pode ser editada agora pelo Organizador logado — mesma regra
 * checada (com trava contra corrida) em `travarPartidaEditavel`, aqui só
 * pra decidir o que renderizar na UI (as páginas de Partida e do Timer em
 * tela cheia usam a mesma checagem).
 */
export function partidaEstaEditavelPeloOrganizador(
  partida: Pick<Partida, "finalizada">,
  temporadaAberta: boolean,
  organizadorLogado: boolean,
): boolean {
  return organizadorLogado && temporadaAberta && !partida.finalizada;
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

/** Dados inválidos para uma edição da Partida (data, participante ou Lançamento). */
export class DadosDaPartidaInvalidosError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "DadosDaPartidaInvalidosError";
  }
}

export class PartidaFinalizadaError extends Error {
  constructor() {
    super("Esta Partida já foi finalizada e não pode mais ser alterada.");
    this.name = "PartidaFinalizadaError";
  }
}

export class ResultadosIncompletosError extends Error {
  constructor(quantosFaltam: number) {
    super(
      `Ainda falta o resultado de ${quantosFaltam} participante(s) — só é possível finalizar quando no máximo um estiver sem posição (o campeão).`,
    );
    this.name = "ResultadosIncompletosError";
  }
}

/**
 * Cria uma Partida vinculada à Temporada aberta, com um Lançamento vazio
 * (sem posicao/eliminador/pagamento) por participante — "vazio" é o
 * estado "convocado, ainda não saiu".
 */
export async function criarPartida(
  data: string,
  jogadorIdsBrutos: number[],
  atorId: number | null,
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

  await validarJogadoresAtivos(jogadorIds);

  const partidaId = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO partidas (temporada_id, data, criado_por_jogador_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [temporada.id, data, atorId],
    );
    const id = rows[0].id;

    for (const jogadorId of jogadorIds) {
      await client.query(
        `INSERT INTO lancamentos (partida_id, jogador_id, criado_por_jogador_id)
         VALUES ($1, $2, $3)`,
        [id, jogadorId, atorId],
      );
    }

    return id;
  });

  // A Partida acabou de ser criada por esta mesma função — sempre existe.
  return (await buscarPartidaPorId(partidaId))!;
}

async function validarJogadoresAtivos(jogadorIds: number[]): Promise<void> {
  const ativos = await listarJogadoresAtivos();
  const idsAtivos = new Set(ativos.map((j) => j.id));
  for (const jogadorId of jogadorIds) {
    if (!idsAtivos.has(jogadorId)) throw new JogadorInvalidoError(jogadorId);
  }
}

interface LinhaLancamento {
  jogador_id: number;
  nome: string;
  posicao: number | null;
  eliminado_por_jogador_id: number | null;
  eliminado_por_nome: string | null;
  pagamento: boolean;
  quantidade_eliminados: number;
}

export async function buscarPartidaPorId(id: number): Promise<Partida | null> {
  // `to_char` evita que o driver devolva `data` como Date do JS (o tipo
  // `date` do Postgres, sem isso, vem como objeto Date, não string).
  const { rows: partidaRows } = await db.query<{
    id: number;
    temporada_id: number;
    data: string;
    finalizada: boolean;
  }>(
    `SELECT id, temporada_id, to_char(data, 'YYYY-MM-DD') AS data, finalizada
     FROM partidas WHERE id = $1`,
    [id],
  );

  const partidaRow = partidaRows[0];
  if (!partidaRow) return null;

  const temporada = await buscarTemporadaPorId(partidaRow.temporada_id);
  // A Temporada é referenciada por FK (ON DELETE RESTRICT) — sempre existe.
  const tabelaDePontos = temporada!.parametros.tabelaDePontos;

  const { rows: lancamentoRows } = await db.query<LinhaLancamento>(
    `SELECT
       l.jogador_id,
       j.nome,
       l.posicao,
       l.eliminado_por_jogador_id,
       eliminador.nome AS eliminado_por_nome,
       l.pagamento,
       COALESCE(elims.qtd, 0)::integer AS quantidade_eliminados
     FROM lancamentos l
     JOIN jogadores j ON j.id = l.jogador_id
     LEFT JOIN jogadores eliminador ON eliminador.id = l.eliminado_por_jogador_id
     LEFT JOIN (
       SELECT eliminado_por_jogador_id, COUNT(*)::integer AS qtd
       FROM lancamentos
       WHERE partida_id = $1 AND eliminado_por_jogador_id IS NOT NULL
       GROUP BY eliminado_por_jogador_id
     ) elims ON elims.eliminado_por_jogador_id = l.jogador_id
     WHERE l.partida_id = $1
     ORDER BY j.nome`,
    [id],
  );

  const lancamentos: LancamentoDaPartida[] = lancamentoRows.map((linha) => {
    const almas = calcularAlmas(linha.quantidade_eliminados, linha.posicao);

    return {
      jogadorId: linha.jogador_id,
      nome: linha.nome,
      posicao: linha.posicao,
      eliminadoPorJogadorId: linha.eliminado_por_jogador_id,
      eliminadoPorNome: linha.eliminado_por_nome,
      pagamento: linha.pagamento,
      almas,
      pontos:
        linha.posicao === null
          ? null
          : calcularPontosDoLancamento({ posicao: linha.posicao, almas }, tabelaDePontos),
    };
  });

  return {
    id: partidaRow.id,
    temporadaId: partidaRow.temporada_id,
    data: partidaRow.data,
    finalizada: partidaRow.finalizada,
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

interface LancamentoTravado {
  id: number;
  jogadorId: number;
  posicao: number | null;
  eliminadoPorJogadorId: number | null;
  pagamento: boolean;
}

/**
 * Trava a Partida e a Temporada (`FOR UPDATE`, mesmo padrão usado em
 * `encerrarTemporada`/`lancarSaidaManual`/`timer.ts`) dentro de uma
 * transação, e garante que a Partida ainda pode ser editada agora — sem
 * isso, duas edições concorrentes da mesma Partida (ou uma edição
 * correndo junto com `finalizarPartida`/`encerrarTemporada`) poderiam ler
 * um estado desatualizado e pisar uma na outra. Retorna os Lançamentos já
 * sob a trava, pra quem chamou decidir o que fazer com eles.
 */
async function travarPartidaEditavel(
  client: PoolClient,
  partidaId: number,
): Promise<{ temporadaId: number; lancamentos: LancamentoTravado[] }> {
  const { rows: partidaRows } = await client.query<{
    temporada_id: number;
    finalizada: boolean;
  }>(`SELECT temporada_id, finalizada FROM partidas WHERE id = $1 FOR UPDATE`, [partidaId]);

  const partidaRow = partidaRows[0];
  if (!partidaRow) throw new Error(`Partida ${partidaId} não encontrada.`);
  if (partidaRow.finalizada) throw new PartidaFinalizadaError();

  const { rows: temporadaRows } = await client.query<{ aberta: boolean }>(
    `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
    [partidaRow.temporada_id],
  );
  if (!temporadaRows[0]?.aberta) throw new TemporadaEncerradaError();

  const { rows: lancamentoRows } = await client.query<{
    id: number;
    jogador_id: number;
    posicao: number | null;
    eliminado_por_jogador_id: number | null;
    pagamento: boolean;
  }>(
    `SELECT id, jogador_id, posicao, eliminado_por_jogador_id, pagamento
     FROM lancamentos WHERE partida_id = $1 FOR UPDATE`,
    [partidaId],
  );

  return {
    temporadaId: partidaRow.temporada_id,
    lancamentos: lancamentoRows.map((r) => ({
      id: r.id,
      jogadorId: r.jogador_id,
      posicao: r.posicao,
      eliminadoPorJogadorId: r.eliminado_por_jogador_id,
      pagamento: r.pagamento,
    })),
  };
}

/** Edita a data de uma Partida ainda não finalizada. */
export async function editarDataDaPartida(
  partidaId: number,
  novaData: string,
  atorId: number | null,
): Promise<Partida> {
  if (!novaData) {
    throw new DadosDaPartidaInvalidosError("Informe a data da Partida.");
  }

  await withTransaction(async (client) => {
    await travarPartidaEditavel(client, partidaId);
    await client.query(
      `UPDATE partidas
       SET data = $2, atualizado_por_jogador_id = $3, atualizado_em = now()
       WHERE id = $1`,
      [partidaId, novaData, atorId],
    );
  });

  return (await buscarPartidaPorId(partidaId))!;
}

/** Adiciona um Jogador ativo como participante de uma Partida ainda não finalizada. */
export async function adicionarParticipante(
  partidaId: number,
  jogadorId: number,
  atorId: number | null,
): Promise<Partida> {
  await validarJogadoresAtivos([jogadorId]);

  await withTransaction(async (client) => {
    const { lancamentos } = await travarPartidaEditavel(client, partidaId);

    if (lancamentos.some((l) => l.jogadorId === jogadorId)) {
      throw new DadosDaPartidaInvalidosError("Este Jogador já é participante desta Partida.");
    }

    await client.query(
      `INSERT INTO lancamentos (partida_id, jogador_id, criado_por_jogador_id)
       VALUES ($1, $2, $3)`,
      [partidaId, jogadorId, atorId],
    );
  });

  return (await buscarPartidaPorId(partidaId))!;
}

/**
 * Remove um Jogador da lista de participantes de uma Partida ainda não
 * finalizada — pro caso do Organizador ter selecionado alguém que no fim
 * não vai jogar (ver CONTEXT.md — Partida). Só permite remover um
 * Lançamento ainda "vazio": sem Posição, sem Eliminador e sem ter
 * eliminado ninguém — se já carrega resultado de verdade, o jeito certo
 * de tirar alguém da Partida é marcar "Saiu" (ou usar "Desfazer" antes),
 * não apagar o registro. Mantém o mínimo de participantes da Partida.
 *
 * Sem `atorId`: a linha some, não sobra onde gravar "quem removeu" — e,
 * assim como `adicionarParticipante`, é uma ação de alta frequência e
 * baixo valor de auditoria (ver o comentário em `AcaoDeAuditoria`).
 */
export async function removerParticipante(
  partidaId: number,
  jogadorId: number,
): Promise<Partida> {
  await withTransaction(async (client) => {
    const { lancamentos } = await travarPartidaEditavel(client, partidaId);

    const lancamento = lancamentos.find((l) => l.jogadorId === jogadorId);
    if (!lancamento) {
      throw new DadosDaPartidaInvalidosError("Jogador não é participante desta Partida.");
    }
    if (lancamento.posicao !== null || lancamento.eliminadoPorJogadorId !== null) {
      throw new DadosDaPartidaInvalidosError(
        "Este participante já tem resultado lançado — desfaça antes de remover.",
      );
    }
    if (lancamentos.some((l) => l.eliminadoPorJogadorId === jogadorId)) {
      throw new DadosDaPartidaInvalidosError(
        "Este participante já eliminou alguém nesta Partida e não pode ser removido.",
      );
    }
    if (lancamentos.length - 1 < MINIMO_DE_PARTICIPANTES) {
      throw new MinimoDeParticipantesError();
    }

    await client.query(
      `DELETE FROM lancamentos WHERE partida_id = $1 AND jogador_id = $2`,
      [partidaId, jogadorId],
    );
  });

  return (await buscarPartidaPorId(partidaId))!;
}

function validarEliminador(
  lancamentos: { jogadorId: number; posicao: number | null }[],
  jogadorId: number,
  eliminadoPorJogadorId: number | null,
  { exigirEliminadorAtivo }: { exigirEliminadorAtivo: boolean },
): void {
  if (eliminadoPorJogadorId === null) return;

  if (eliminadoPorJogadorId === jogadorId) {
    throw new DadosDaPartidaInvalidosError("Um Jogador não pode eliminar a si mesmo.");
  }

  const eliminador = lancamentos.find((l) => l.jogadorId === eliminadoPorJogadorId);
  if (!eliminador) {
    throw new DadosDaPartidaInvalidosError("O eliminador precisa ser um participante desta Partida.");
  }
  if (exigirEliminadorAtivo && eliminador.posicao !== null) {
    throw new DadosDaPartidaInvalidosError(
      "O eliminador precisa ser um participante ainda ativo (sem posição definida).",
    );
  }
}

/**
 * A posição livre pra quem sai agora, contando do maior número pro menor
 * — a mesma regra de "quantos ainda estão ativos" de antes, só que
 * calculada como "maior posição de 1..N ainda não usada" em vez de "total
 * menos quantos já têm posição". Dá no mesmo enquanto as posições forem
 * preenchidas só por `marcarSaida`, mas evita colidir com uma posição que
 * o Organizador já tenha atribuído manualmente fora de ordem (via
 * `atualizarLancamento`, no fluxo "lançar tudo no final").
 */
function proximaPosicaoLivre(lancamentos: { posicao: number | null }[]): number {
  const total = lancamentos.length;
  const ocupadas = new Set(
    lancamentos.map((l) => l.posicao).filter((p): p is number => p !== null),
  );
  for (let posicao = total; posicao >= 1; posicao--) {
    if (!ocupadas.has(posicao)) return posicao;
  }
  // Não deveria acontecer: só chegamos aqui quando o próprio chamador já
  // confirmou que o jogador que está saindo ainda não tem posição.
  throw new Error("Não há posição livre para atribuir.");
}

/**
 * Atualiza Posição, Eliminador e/ou Pagamento de um participante — usado
 * pelo fluxo de "lançar tudo no final" (ou pra corrigir um valor a
 * qualquer momento antes de finalizar). Ver `marcarSaida` para o fluxo
 * incremental ("fulano saiu agora").
 */
export async function atualizarLancamento(
  partidaId: number,
  jogadorId: number,
  dados: AtualizacaoDeLancamento,
  atorId: number | null,
): Promise<Partida> {
  await withTransaction(async (client) => {
    const { lancamentos } = await travarPartidaEditavel(client, partidaId);

    const lancamento = lancamentos.find((l) => l.jogadorId === jogadorId);
    if (!lancamento) {
      throw new DadosDaPartidaInvalidosError("Jogador não é participante desta Partida.");
    }

    const posicao = dados.posicao !== undefined ? dados.posicao : lancamento.posicao;
    const eliminadoPorJogadorId =
      dados.eliminadoPorJogadorId !== undefined
        ? dados.eliminadoPorJogadorId
        : lancamento.eliminadoPorJogadorId;
    const pagamento = dados.pagamento !== undefined ? dados.pagamento : lancamento.pagamento;

    if (posicao !== null) {
      if (!Number.isInteger(posicao) || posicao < 1) {
        throw new DadosDaPartidaInvalidosError(`Posição inválida para o jogador ${jogadorId}.`);
      }
      const jaOcupada = lancamentos.some(
        (l) => l.jogadorId !== jogadorId && l.posicao === posicao,
      );
      if (jaOcupada) {
        throw new DadosDaPartidaInvalidosError(`Posição ${posicao} já está ocupada por outro participante.`);
      }
    }

    validarEliminador(lancamentos, jogadorId, eliminadoPorJogadorId, { exigirEliminadorAtivo: false });

    await client.query(
      `UPDATE lancamentos
       SET posicao = $3, eliminado_por_jogador_id = $4, pagamento = $5,
           atualizado_por_jogador_id = $6, atualizado_em = now()
       WHERE partida_id = $1 AND jogador_id = $2`,
      [partidaId, jogadorId, posicao, eliminadoPorJogadorId, pagamento, atorId],
    );

    // Corrige posição/eliminador de alguém — é onde mais rola disputa
    // ("quem mudou minha posição?"). Ver ticket 44.
    await registrarEvento(client, {
      jogadorId: atorId,
      acao: "lancamento.atualizado",
      entidadeTipo: "lancamento",
      entidadeId: lancamento.id,
      dadosAntes: {
        posicao: lancamento.posicao,
        eliminadoPorJogadorId: lancamento.eliminadoPorJogadorId,
        pagamento: lancamento.pagamento,
      },
      dadosDepois: { posicao, eliminadoPorJogadorId, pagamento },
    });
  });

  return (await buscarPartidaPorId(partidaId))!;
}

/**
 * "Fulano saiu agora": atribui a posição automaticamente (contando os
 * participantes ainda ativos, do maior pro menor) e registra quem
 * eliminou. O eliminador precisa ser outro participante ainda ativo.
 */
export async function marcarSaida(
  partidaId: number,
  jogadorId: number,
  eliminadoPorJogadorId: number | null,
  atorId: number | null,
): Promise<Partida> {
  await withTransaction(async (client) => {
    const { lancamentos } = await travarPartidaEditavel(client, partidaId);

    const lancamento = lancamentos.find((l) => l.jogadorId === jogadorId);
    if (!lancamento) {
      throw new DadosDaPartidaInvalidosError("Jogador não é participante desta Partida.");
    }
    if (lancamento.posicao !== null) {
      throw new DadosDaPartidaInvalidosError("Este participante já tem uma posição registrada.");
    }

    validarEliminador(lancamentos, jogadorId, eliminadoPorJogadorId, { exigirEliminadorAtivo: true });

    const posicao = proximaPosicaoLivre(lancamentos);

    await client.query(
      `UPDATE lancamentos
       SET posicao = $3, eliminado_por_jogador_id = $4,
           atualizado_por_jogador_id = $5, atualizado_em = now()
       WHERE partida_id = $1 AND jogador_id = $2`,
      [partidaId, jogadorId, posicao, eliminadoPorJogadorId, atorId],
    );

    await registrarEvento(client, {
      jogadorId: atorId,
      acao: "lancamento.atualizado",
      entidadeTipo: "lancamento",
      entidadeId: lancamento.id,
      dadosAntes: { posicao: null, eliminadoPorJogadorId: null },
      dadosDepois: { posicao, eliminadoPorJogadorId },
    });
  });

  const partida = (await buscarPartidaPorId(partidaId))!;

  // Fora da transação (chamada de rede) — mesmo motivo de
  // `notificarMudancaDeNivel` (src/lib/push.ts): não pode segurar lock
  // nem falhar a saída do Jogador se o envio falhar. Nome/posição vêm do
  // Lançamento já recarregado acima (`travarPartidaEditavel` não traz
  // `nome`, é só a trava).
  const lancamentoAtualizado = partida.lancamentos.find((l) => l.jogadorId === jogadorId);
  if (lancamentoAtualizado?.posicao != null) {
    notificarJogadorSaiu(partidaId, lancamentoAtualizado.nome, lancamentoAtualizado.posicao).catch(
      (error) => console.error("Falha ao notificar saída do Jogador", error),
    );
  }

  return partida;
}

export interface PartidaFinalizada {
  partida: Partida;
  premiacao: PremiacaoDaPartida;
  entradaNoCaixa: number;
}

/**
 * Finaliza a Partida: se sobrar exatamente um participante sem posição,
 * vira o 1º lugar automaticamente (guardou a própria alma até o fim).
 * Calcula a Premiação da Partida e gera a entrada automática no Caixa
 * (substitui uma anterior, se essa Partida já tinha sido finalizada e
 * reaberta — não deveria acontecer hoje, mas o UPSERT é seguro de
 * qualquer forma). Trava a Partida contra novas edições.
 */
export async function finalizarPartida(
  partidaId: number,
  atorId: number | null,
): Promise<PartidaFinalizada> {
  let temporadaId!: number;
  let premiacao!: PremiacaoDaPartida;
  let entradaNoCaixa!: number;

  await withTransaction(async (client) => {
    const travado = await travarPartidaEditavel(client, partidaId);
    temporadaId = travado.temporadaId;

    const semPosicao = travado.lancamentos.filter((l) => l.posicao === null);
    if (semPosicao.length > 1) {
      throw new ResultadosIncompletosError(semPosicao.length);
    }

    if (semPosicao.length === 1) {
      await client.query(
        `UPDATE lancamentos
         SET posicao = 1, atualizado_por_jogador_id = $3, atualizado_em = now()
         WHERE partida_id = $1 AND jogador_id = $2`,
        [partidaId, semPosicao[0].jogadorId, atorId],
      );
    }

    await client.query(
      `UPDATE partidas
       SET finalizada = true, atualizado_por_jogador_id = $2, atualizado_em = now()
       WHERE id = $1`,
      [partidaId, atorId],
    );

    // Parâmetros da Temporada são congelados na criação (ver CONTEXT.md)
    // — ler fora da trava desta transação é seguro, não mudam durante ela.
    const temporada = (await buscarTemporadaPorId(temporadaId))!;
    premiacao = calcularPremiacaoDaPartida(temporada.parametros);
    entradaNoCaixa = calcularEntradaNoCaixa(travado.lancamentos.length, temporada.parametros);

    await client.query(
      `INSERT INTO caixa_transacoes
         (temporada_id, tipo, valor, partida_id, criado_por_jogador_id)
       VALUES ($1, 'entrada_partida', $2, $3, $4)
       ON CONFLICT (partida_id) WHERE tipo = 'entrada_partida'
       DO UPDATE SET valor = EXCLUDED.valor`,
      [temporadaId, entradaNoCaixa, partidaId, atorId],
    );
  });

  const partida = (await buscarPartidaPorId(partidaId))!;

  // Fora da transação (chamada de rede) — mesmo motivo de
  // `notificarMudancaDeNivel` (src/lib/push.ts). O Timer em si é encerrado
  // pela rota (`api/partidas/[id]/finalizar/route.ts`, ticket 48) — não
  // aqui, pra não criar um import circular (`timer.ts` já importa deste
  // arquivo).
  notificarPartidaTerminou(
    partidaId,
    partida.lancamentos.map((l) => ({ nome: l.nome, posicao: l.posicao, pontos: l.pontos })),
  ).catch((error) => console.error("Falha ao notificar término da Partida", error));

  return { partida, premiacao, entradaNoCaixa };
}

/**
 * Converte os erros de domínio da Partida numa resposta HTTP — usada
 * pelas rotas de criar/editar/finalizar, que só diferem na função
 * chamada. Retorna null se o erro não for um dos esperados (a rota deve
 * relançar nesse caso).
 */
export function respostaDeErroDaPartida(error: unknown): NextResponse | null {
  if (
    error instanceof MinimoDeParticipantesError ||
    error instanceof JogadorInvalidoError ||
    error instanceof DadosDaPartidaInvalidosError
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (
    error instanceof NenhumaTemporadaAbertaError ||
    error instanceof TemporadaEncerradaError ||
    error instanceof PartidaFinalizadaError ||
    error instanceof ResultadosIncompletosError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  return null;
}
