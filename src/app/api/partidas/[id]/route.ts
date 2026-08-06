import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { buscarPartidaPorId } from "@/lib/partidas";

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
