import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { removerParticipante, respostaDeErroDaPartida } from "@/lib/partidas";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; jogadorId: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id, jogadorId: jogadorIdParam } = await params;
  const partidaId = Number(id);
  const jogadorId = Number(jogadorIdParam);
  if (!Number.isInteger(partidaId) || !Number.isInteger(jogadorId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  try {
    const partida = await removerParticipante(partidaId, jogadorId);
    return NextResponse.json({ partida });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
