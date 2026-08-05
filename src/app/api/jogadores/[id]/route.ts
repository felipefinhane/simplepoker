import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  OrganizadorNaoPodeSerDesativadoError,
  definirAtivoDoJogador,
  editarNomeDoJogador,
} from "@/lib/jogadores";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : undefined;
  const ativo = typeof body?.ativo === "boolean" ? body.ativo : undefined;

  if (nome === undefined && ativo === undefined) {
    return NextResponse.json(
      { error: "Informe nome e/ou ativo para atualizar." },
      { status: 400 },
    );
  }
  if (nome !== undefined && !nome) {
    return NextResponse.json(
      { error: "O nome não pode ficar vazio." },
      { status: 400 },
    );
  }

  let jogador = null;
  try {
    if (nome !== undefined) {
      jogador = await editarNomeDoJogador(id, nome);
    }
    if (ativo !== undefined) {
      jogador = await definirAtivoDoJogador(id, ativo);
    }
  } catch (error) {
    if (error instanceof OrganizadorNaoPodeSerDesativadoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (!jogador) {
    return NextResponse.json(
      { error: "Jogador não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ jogador });
}
