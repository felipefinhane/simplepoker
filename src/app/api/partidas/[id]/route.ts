import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { buscarPartidaPorId, editarDataDaPartida, respostaDeErroDaPartida } from "@/lib/partidas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const partida = await buscarPartidaPorId(id);
  if (!partida) {
    return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ partida });
}

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
  const data = typeof body?.data === "string" ? body.data : "";

  try {
    const partida = await editarDataDaPartida(id, data);
    return NextResponse.json({ partida });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
