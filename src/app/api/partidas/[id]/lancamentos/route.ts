import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { TemporadaEncerradaError } from "@/lib/temporadas";
import { LancamentosInvalidosError, lancarResultado } from "@/lib/partidas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id: idParam } = await params;
  const partidaId = Number(idParam);
  if (!Number.isInteger(partidaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const entradas = Array.isArray(body?.entradas)
    ? body.entradas.map((e: Record<string, unknown>) => ({
        jogadorId: Number(e.jogadorId),
        posicao: Number(e.posicao),
        almas: Number(e.almas),
        pagamento: Boolean(e.pagamento),
      }))
    : null;

  if (!entradas || entradas.length === 0) {
    return NextResponse.json(
      { error: "Informe o resultado dos participantes." },
      { status: 400 },
    );
  }

  try {
    const resultado = await lancarResultado(partidaId, entradas);
    if (!resultado) {
      return NextResponse.json({ error: "Partida não encontrada." }, { status: 404 });
    }
    return NextResponse.json(resultado);
  } catch (error) {
    if (error instanceof TemporadaEncerradaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof LancamentosInvalidosError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
