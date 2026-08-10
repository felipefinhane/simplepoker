import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  ParametrosInvalidosError,
  TemporadaEncerradaError,
  editarParametrosDaTemporada,
  serializarTemporada,
} from "@/lib/temporadas";

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

  const parametros = await request.json().catch(() => null);

  try {
    const temporada = await editarParametrosDaTemporada(
      id,
      parametros,
      organizadorOuResposta.id,
    );
    if (!temporada) {
      return NextResponse.json(
        { error: "Temporada não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ temporada: serializarTemporada(temporada) });
  } catch (error) {
    if (error instanceof TemporadaEncerradaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ParametrosInvalidosError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
