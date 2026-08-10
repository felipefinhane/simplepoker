import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { criarPartida, listarPartidas, respostaDeErroDaPartida } from "@/lib/partidas";

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
    const partida = await criarPartida(data, jogadorIds, organizadorOuResposta.id);
    return NextResponse.json({ partida }, { status: 201 });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
