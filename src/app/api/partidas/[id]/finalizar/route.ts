import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { finalizarPartida, respostaDeErroDaPartida } from "@/lib/partidas";
import { encerrarTimer } from "@/lib/timer";

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

    // Best-effort: finalizar a Partida já valeu, mesmo que isso falhe —
    // não deixa o Timer rodando de verdade pra ninguém (só a exibição
    // "encerrado" fica desatualizada até uma nova tentativa).
    try {
      await encerrarTimer(partidaId);
    } catch (error) {
      console.error("Falha ao encerrar o Timer junto com a Partida", error);
    }

    return NextResponse.json(resultado);
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
