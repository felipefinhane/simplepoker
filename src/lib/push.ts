import webpush from "web-push";
import { db } from "@/lib/db";
import type { NivelDeBlind } from "@/domain/types";

export interface AssinaturaPush {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

let configurado = false;

/**
 * Configura as chaves VAPID uma única vez (lazy — só na primeira chamada
 * que realmente precisa enviar ou aceitar uma inscrição). Sem as chaves
 * configuradas (ambiente sem `VAPID_PRIVATE_KEY`, ex: alguém rodando local
 * sem copiar o `.env.example`), notificação push fica desligada, mas o
 * resto do Timer segue funcionando normalmente — nunca lança erro aqui.
 */
function garantirConfigurado(): boolean {
  if (configurado) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contato@poker.finhane.com";
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configurado = true;
  return true;
}

/**
 * Grava (ou atualiza, se o mesmo dispositivo já tinha se inscrito antes —
 * ex: reabriu o app) a inscrição de notificação de uma Partida.
 */
export async function salvarInscricao(
  partidaId: number,
  assinatura: AssinaturaPush,
): Promise<void> {
  await db.query(
    `INSERT INTO push_subscriptions (partida_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (partida_id, endpoint) DO UPDATE
     SET p256dh = $3, auth = $4`,
    [partidaId, assinatura.endpoint, assinatura.keys.p256dh, assinatura.keys.auth],
  );
}

/** Cancela a inscrição (usuário desativou, ou o navegador invalidou). */
export async function removerInscricao(partidaId: number, endpoint: string): Promise<void> {
  await db.query(
    `DELETE FROM push_subscriptions WHERE partida_id = $1 AND endpoint = $2`,
    [partidaId, endpoint],
  );
}

interface LinhaInscricao {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Notifica quem estiver inscrito nesta Partida que o nível de blind mudou
 * — chamada depois de `pularNivel`/`voltarNivel` (manual) e de
 * `avancarNiveisVencidos` (automático, ver ticket 36), nunca de dentro da
 * transação que grava o Timer (é uma chamada de rede pra fora, não deve
 * segurar nenhum lock nem falhar a mudança de nível se o envio falhar).
 * Sem chaves VAPID configuradas, não faz nada (ver `garantirConfigurado`).
 */
export async function notificarMudancaDeNivel(
  partidaId: number,
  nivel: number,
  totalDeNiveis: number,
  nivelAtual: NivelDeBlind,
): Promise<void> {
  if (!garantirConfigurado()) return;

  const { rows } = await db.query<LinhaInscricao>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE partida_id = $1`,
    [partidaId],
  );
  if (rows.length === 0) return;

  const payload = JSON.stringify({
    titulo: "Blind mudou! 🃏",
    corpo: `Nível ${nivel + 1} de ${totalDeNiveis} — ${nivelAtual.blindPequeno}/${nivelAtual.blindGrande}`,
    url: `/partidas/${partidaId}/timer`,
  });

  await Promise.allSettled(
    rows.map(async (linha) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: linha.endpoint,
            keys: { p256dh: linha.p256dh, auth: linha.auth },
          },
          payload,
        );
      } catch (error) {
        // 404/410 = inscrição expirada ou revogada pelo navegador — limpa
        // do banco. Qualquer outro erro (rede, etc.) só loga e segue: uma
        // notificação perdida não pode derrubar a troca de nível.
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removerInscricao(partidaId, linha.endpoint);
        } else {
          console.error("Falha ao enviar notificação push", error);
        }
      }
    }),
  );
}
