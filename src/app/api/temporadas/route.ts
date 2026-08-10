import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  JaExisteTemporadaAbertaError,
  ParametrosInvalidosError,
  criarTemporada,
  listarTemporadas,
  serializarTemporada,
} from "@/lib/temporadas";

export async function GET() {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const temporadas = await listarTemporadas();
  return NextResponse.json({ temporadas: temporadas.map(serializarTemporada) });
}

export async function POST(request: Request) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const parametros = await request.json().catch(() => null);

  try {
    const temporada = await criarTemporada(parametros, organizadorOuResposta.id);
    return NextResponse.json(
      { temporada: serializarTemporada(temporada) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof JaExisteTemporadaAbertaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ParametrosInvalidosError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
