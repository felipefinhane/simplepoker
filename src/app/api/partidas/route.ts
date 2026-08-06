import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  JogadorInvalidoError,
  MinimoDeParticipantesError,
  NenhumaTemporadaAbertaError,
  criarPartida,
  listarPartidas,
} from "@/lib/partidas";

export async function GET() {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const partidas = await listarPartidas();
  return NextResponse.json({ partidas });
}

export async function POST(request: Request) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const body = await request.json().catch(() => null);
  const data = typeof body?.data === "string" ? body.data : "";
  const jogadorIds = Array.isArray(body?.jogadorIds)
    ? body.jogadorIds.filter((id: unknown) => Number.isInteger(id))
    : [];

  if (!data) {
    return NextResponse.json({ error: "Informe a data da Partida." }, { status: 400 });
  }

  try {
    const partida = await criarPartida(data, jogadorIds);
    return NextResponse.json({ partida }, { status: 201 });
  } catch (error) {
    if (
      error instanceof MinimoDeParticipantesError ||
      error instanceof JogadorInvalidoError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NenhumaTemporadaAbertaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
