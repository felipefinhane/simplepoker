import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";
import {
  type AtualizacaoDeLancamento,
  atualizarLancamento,
  respostaDeErroDaPartida,
} from "@/lib/partidas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; jogadorId: string }> },
) {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  const { id, jogadorId: jogadorIdParam } = await params;
  const partidaId = Number(id);
  const jogadorId = Number(jogadorIdParam);
  if (!Number.isInteger(partidaId) || !Number.isInteger(jogadorId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const dados: AtualizacaoDeLancamento = {};

  if (body && "posicao" in body) {
    dados.posicao = body.posicao === null ? null : Number(body.posicao);
  }
  if (body && "eliminadoPorJogadorId" in body) {
    dados.eliminadoPorJogadorId =
      body.eliminadoPorJogadorId === null ? null : Number(body.eliminadoPorJogadorId);
  }
  if (body && "pagamento" in body) {
    dados.pagamento = Boolean(body.pagamento);
  }

  try {
    const partida = await atualizarLancamento(
      partidaId,
      jogadorId,
      dados,
      organizadorOuResposta.id,
    );
    return NextResponse.json({ partida });
  } catch (error) {
    const resposta = respostaDeErroDaPartida(error);
    if (resposta) return resposta;
    throw error;
  }
}
