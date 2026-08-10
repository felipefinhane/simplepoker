import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { criarJogador, listarJogadores } from "@/lib/jogadores";

export async function GET() {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const jogadores = await listarJogadores();
  return NextResponse.json({ jogadores });
}

export async function POST(request: Request) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const body = await request.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";

  if (!nome) {
    return NextResponse.json(
      { error: "Informe o nome do Jogador." },
      { status: 400 },
    );
  }

  const jogador = await criarJogador(nome, organizadorOuResposta.id);
  return NextResponse.json({ jogador }, { status: 201 });
}
