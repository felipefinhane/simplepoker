import { NextResponse } from "next/server";
import { salvarInscricao, removerInscricao, ehAssinaturaValida } from "@/lib/push";

/**
 * Inscrição/cancelamento de notificação push **global** (ticket 48) —
 * "avisar sempre que uma Partida começar/terminar/perder gente", sem
 * precisar já estar com a tela dela aberta. Público, igual à contextual em
 * `/api/partidas/[id]/timer/notificacoes` — só não tem `partidaId` na URL,
 * vira uma linha com `partida_id = NULL` em `push_subscriptions` (ver
 * `salvarInscricao`).
 */

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  if (!ehAssinaturaValida(corpo)) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await salvarInscricao(null, corpo);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const corpo = await request.json().catch(() => null);
  const endpoint = (corpo as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Endpoint inválido." }, { status: 400 });
  }

  await removerInscricao(null, endpoint);
  return NextResponse.json({ ok: true });
}
