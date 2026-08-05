import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "./session";
import { verificarSenha, hashSenha } from "./senha";
import { normalizarTelefone } from "./telefone";

export interface Organizador {
  id: number;
  nome: string;
  telefone: string;
}

/**
 * Confere telefone + senha contra os Jogadores com eh_organizador = true.
 * Retorna o Organizador em caso de sucesso, ou null se telefone/senha não
 * baterem. O telefone é normalizado antes da busca, pra "11 99999-8888" e
 * "11999998888" baterem com o que foi salvo (ver seed-organizador.ts).
 */
export async function autenticarOrganizador(
  telefone: string,
  senha: string,
): Promise<Organizador | null> {
  const { rows } = await db.query<{
    id: number;
    nome: string;
    telefone: string;
    senha_hash: string;
  }>(
    `SELECT id, nome, telefone, senha_hash
     FROM jogadores
     WHERE telefone = $1 AND eh_organizador = true`,
    [normalizarTelefone(telefone)],
  );

  const linha = rows[0];
  if (!linha) return null;

  const senhaCorreta = await verificarSenha(senha, linha.senha_hash);
  if (!senhaCorreta) return null;

  return { id: linha.id, nome: linha.nome, telefone: linha.telefone };
}

/** O Organizador da sessão atual, ou null se não houver sessão válida. */
export async function getOrganizadorLogado(): Promise<Organizador | null> {
  const session = await getSession();
  if (!session.jogadorId) return null;

  const { rows } = await db.query<{
    id: number;
    nome: string;
    telefone: string;
  }>(
    `SELECT id, nome, telefone
     FROM jogadores
     WHERE id = $1 AND eh_organizador = true`,
    [session.jogadorId],
  );

  return rows[0] ?? null;
}

/**
 * Guarda usado pelas rotas restritas (a própria trocar-senha, e as dos
 * próximos tickets): retorna o Organizador logado, ou lança se não houver
 * sessão válida. Cada rota decide como transformar essa exceção numa
 * resposta 401 (ver src/app/api/auth/me/route.ts para o padrão).
 */
export class NaoAutenticadoError extends Error {
  constructor() {
    super("Nenhum Organizador autenticado.");
    this.name = "NaoAutenticadoError";
  }
}

export async function requireOrganizador(): Promise<Organizador> {
  const organizador = await getOrganizadorLogado();
  if (!organizador) throw new NaoAutenticadoError();
  return organizador;
}

/**
 * Mesma checagem de `requireOrganizador`, mas já pronta pra usar no topo
 * de uma rota: se não houver sessão válida, devolve a resposta 401 pronta
 * em vez de lançar — evita repetir o mesmo try/catch em cada rota.
 *
 * Uso: `const r = await requireOrganizadorOuResposta(); if (r instanceof
 * NextResponse) return r;` — daí `r` é o Organizador.
 */
export async function requireOrganizadorOuResposta(): Promise<
  Organizador | NextResponse
> {
  try {
    return await requireOrganizador();
  } catch (error) {
    if (error instanceof NaoAutenticadoError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}

/**
 * Troca a senha do Organizador logado, conferindo a senha atual antes.
 * Retorna false se a senha atual não bater.
 */
export async function trocarSenha(
  jogadorId: number,
  senhaAtual: string,
  novaSenha: string,
): Promise<boolean> {
  const { rows } = await db.query<{ senha_hash: string }>(
    `SELECT senha_hash FROM jogadores WHERE id = $1 AND eh_organizador = true`,
    [jogadorId],
  );

  const linha = rows[0];
  if (!linha) return false;

  const senhaAtualCorreta = await verificarSenha(senhaAtual, linha.senha_hash);
  if (!senhaAtualCorreta) return false;

  const novoHash = await hashSenha(novaSenha);
  await db.query(`UPDATE jogadores SET senha_hash = $1 WHERE id = $2`, [
    novoHash,
    jogadorId,
  ]);

  return true;
}
