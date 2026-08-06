import { NextResponse } from "next/server";
import { buscarEstadoDoTimer } from "@/lib/timer";

/** Público — qualquer pessoa com o app aberto acompanha o Timer. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const partidaId = Number(id);
  if (!Number.isInteger(partidaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const estado = await buscarEstadoDoTimer(partidaId);
  if (!estado) {
    return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });
  }

  return NextResponse.json(estado);
}
