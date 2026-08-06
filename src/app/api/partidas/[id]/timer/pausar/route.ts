import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { pausarTimer, respostaDeErroDoTimer } from "@/lib/timer";

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
    const estado = await pausarTimer(partidaId);
    return NextResponse.json(estado);
  } catch (error) {
    const resposta = respostaDeErroDoTimer(error);
    if (resposta) return resposta;
    throw error;
  }
}
