import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { adicionarParticipante, respostaDeErroDaPartida } from "@/lib/partidas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id } = await params;
  const partidaId = Number(id);
  if (!Number.isInteger(partidaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const jogadorId = Number(body?.jogadorId);
  if (!Number.isInteger(jogadorId)) {
    return NextResponse.json({ error: "Informe o jogadorId." }, { status: 400 });
  }

  try {
    const partida = await adicionarParticipante(partidaId, jogadorId, organizadorOuResposta.id);
    return NextResponse.json({ partida }, { status: 201 });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
