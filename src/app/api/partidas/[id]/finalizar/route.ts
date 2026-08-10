import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { finalizarPartida, respostaDeErroDaPartida } from "@/lib/partidas";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id } = await params;
  const partidaId = Number(id);
  if (!Number.isInteger(partidaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  try {
    const resultado = await finalizarPartida(partidaId, organizadorOuResposta.id);
    return NextResponse.json(resultado);
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
