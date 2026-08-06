import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { marcarSaida, respostaDeErroDaPartida } from "@/lib/partidas";

export async function POST(
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

  const body = await request.json().catch(() => null);
  const eliminadoPorJogadorId =
    body?.eliminadoPorJogadorId == null ? null : Number(body.eliminadoPorJogadorId);

  try {
    const partida = await marcarSaida(partidaId, jogadorId, eliminadoPorJogadorId);
    return NextResponse.json({ partida });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
