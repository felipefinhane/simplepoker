import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  OrganizadorNaoPodeSerDesativadoError,
  TelefoneJaCadastradoError,
  TelefoneObrigatorioParaOrganizadorError,
  UltimoOrganizadorNaoPodeSerRemovidoError,
  definirAtivoDoJogador,
  definirOrganizadorDoJogador,
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
  const ehOrganizador =
    typeof body?.ehOrganizador === "boolean" ? body.ehOrganizador : undefined;
  const telefone = typeof body?.telefone === "string" ? body.telefone : undefined;

  if (nome === undefined && ativo === undefined && ehOrganizador === undefined) {
    return NextResponse.json(
      { error: "Informe nome, ativo e/ou ehOrganizador para atualizar." },
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
    if (ehOrganizador !== undefined) {
      jogador = await definirOrganizadorDoJogador(id, ehOrganizador, telefone);
    }
  } catch (error) {
    if (
      error instanceof OrganizadorNaoPodeSerDesativadoError ||
      error instanceof TelefoneObrigatorioParaOrganizadorError ||
      error instanceof TelefoneJaCadastradoError ||
      error instanceof UltimoOrganizadorNaoPodeSerRemovidoError
    ) {
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
