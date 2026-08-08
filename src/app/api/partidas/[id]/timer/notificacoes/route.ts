import { NextResponse } from "next/server";
import { buscarEstadoDoTimer } from "@/lib/timer";
import { salvarInscricao, removerInscricao, type AssinaturaPush } from "@/lib/push";

/**
 * Inscrição/cancelamento de notificação push do Timer de uma Partida —
 * público (igual ao GET do Timer, ticket 14): qualquer visitante pode
 * ativar "avisar quando o blind mudar" no próprio dispositivo, não só o
 * Organizador. Ver `notificarMudancaDeNivel` em `src/lib/push.ts`.
 */

function ehAssinaturaValida(corpo: unknown): corpo is AssinaturaPush {
  if (!corpo || typeof corpo !== "object") return false;
  const assinatura = corpo as Partial<AssinaturaPush>;
  return (
    typeof assinatura.endpoint === "string" &&
    typeof assinatura.keys === "object" &&
    assinatura.keys !== null &&
    typeof assinatura.keys.p256dh === "string" &&
    typeof assinatura.keys.auth === "string"
  );
}

export async function POST(
  request: Request,
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

  const corpo = await request.json().catch(() => null);
  if (!ehAssinaturaValida(corpo)) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await salvarInscricao(partidaId, corpo);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const partidaId = Number(id);
  if (!Number.isInteger(partidaId)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const corpo = await request.json().catch(() => null);
  const endpoint = (corpo as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Endpoint inválido." }, { status: 400 });
  }

  await removerInscricao(partidaId, endpoint);
  return NextResponse.json({ ok: true });
}
