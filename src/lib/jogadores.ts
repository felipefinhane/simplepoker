import { db } from "@/lib/db";

/** Um Jogador tal como listado/editado pelo Organizador. Ver CONTEXT.md. */
export interface Jogador {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
}

interface LinhaJogador {
  id: number;
  nome: string;
  ativo: boolean;
  eh_organizador: boolean;
}

const COLUNAS_DO_JOGADOR = "id, nome, ativo, eh_organizador";

function linhaParaJogador(linha: LinhaJogador): Jogador {
  return {
    id: linha.id,
    nome: linha.nome,
    ativo: linha.ativo,
    ehOrganizador: linha.eh_organizador,
  };
}

/**
 * Um Organizador não pode ser desativado por aqui — a semântica de
 * "desativar" para quem tem login ainda não foi definida no domínio (ver
 * ticket 04), então recusamos em vez de deixar um `ativo = false` que não
 * teria efeito nenhum no login.
 */
export class OrganizadorNaoPodeSerDesativadoError extends Error {
  constructor() {
    super("Um Organizador não pode ser desativado por aqui.");
    this.name = "OrganizadorNaoPodeSerDesativadoError";
  }
}

/** Cria um novo Jogador com apenas o nome (sem login — ver Organizador). */
export async function criarJogador(nome: string): Promise<Jogador> {
  const { rows } = await db.query<LinhaJogador>(
    `INSERT INTO jogadores (nome)
     VALUES ($1)
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [nome],
  );

  return linhaParaJogador(rows[0]);
}

/** Todos os Jogadores (ativos e desativados), para a tela de gestão. */
export async function listarJogadores(): Promise<Jogador[]> {
  const { rows } = await db.query<LinhaJogador>(
    `SELECT ${COLUNAS_DO_JOGADOR} FROM jogadores ORDER BY nome`,
  );

  return rows.map(linhaParaJogador);
}

/** Jogadores ativos — a lista usada ao lançar uma nova Partida (ticket 06). */
export async function listarJogadoresAtivos(): Promise<Jogador[]> {
  const { rows } = await db.query<LinhaJogador>(
    `SELECT ${COLUNAS_DO_JOGADOR} FROM jogadores WHERE ativo = true ORDER BY nome`,
  );

  return rows.map(linhaParaJogador);
}

/** Edita o nome de um Jogador existente. Retorna null se o id não existir. */
export async function editarNomeDoJogador(
  id: number,
  nome: string,
): Promise<Jogador | null> {
  const { rows } = await db.query<LinhaJogador>(
    `UPDATE jogadores
     SET nome = $2
     WHERE id = $1
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [id, nome],
  );

  return rows[0] ? linhaParaJogador(rows[0]) : null;
}

/**
 * Ativa/desativa um Jogador. Desativar não apaga nada — o Jogador some das
 * listas de participantes de novas Partidas, mas seu histórico continua
 * intacto (ver CONTEXT.md / ticket 04). Lança
 * `OrganizadorNaoPodeSerDesativadoError` se o alvo for um Organizador e
 * `ativo` for `false`.
 */
export async function definirAtivoDoJogador(
  id: number,
  ativo: boolean,
): Promise<Jogador | null> {
  if (!ativo) {
    const { rows } = await db.query<{ eh_organizador: boolean }>(
      `SELECT eh_organizador FROM jogadores WHERE id = $1`,
      [id],
    );
    if (rows[0]?.eh_organizador) {
      throw new OrganizadorNaoPodeSerDesativadoError();
    }
  }

  const { rows } = await db.query<LinhaJogador>(
    `UPDATE jogadores
     SET ativo = $2
     WHERE id = $1
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [id, ativo],
  );

  return rows[0] ? linhaParaJogador(rows[0]) : null;
}
