import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import { TemporadaEncerradaError } from "@/lib/temporadas";
import { DadosDaSaidaInvalidosError, lancarSaidaManual } from "@/lib/caixa";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id: idParam } = await params;
  const temporadaId = Number(idParam);
  if (!Number.isInteger(temporadaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const data = typeof body?.data === "string" ? body.data : "";
  const descricao = typeof body?.descricao === "string" ? body.descricao : "";
  const valor = Number(body?.valor);

  try {
    const transacao = await lancarSaidaManual(
      temporadaId,
      { data, descricao, valor },
      organizadorOuResposta.id,
    );
    return NextResponse.json({ transacao }, { status: 201 });
  } catch (error) {
    if (error instanceof TemporadaEncerradaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof DadosDaSaidaInvalidosError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
