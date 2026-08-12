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

/** Valida o corpo de um POST de inscrição — usado pelas duas rotas (contextual e global). */
export function ehAssinaturaValida(corpo: unknown): corpo is AssinaturaPush {
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
 * ex: reabriu o app) a inscrição de notificação. `partidaId: null` é a
 * inscrição **global** (ticket 48) — recebe partida começou/terminou/
 * jogador saiu de qualquer Partida; um `partidaId` de verdade é a
 * inscrição **contextual** de sempre (troca de nível de blind, só daquela
 * Partida). São duas linhas independentes na mesma tabela: dá pra estar
 * inscrito nos dois níveis ao mesmo tempo pro mesmo dispositivo.
 */
export async function salvarInscricao(
  partidaId: number | null,
  assinatura: AssinaturaPush,
): Promise<void> {
  if (partidaId === null) {
    // O conflito aqui é pego pelo índice único parcial
    // `push_subscriptions_endpoint_global_unica` (só `endpoint`, só entre
    // linhas com `partida_id IS NULL`) — a constraint `(partida_id,
    // endpoint)` normal não serve pra isso porque SQL trata cada `NULL`
    // como distinto dos demais.
    await db.query(
      `INSERT INTO push_subscriptions (partida_id, endpoint, p256dh, auth)
       VALUES (NULL, $1, $2, $3)
       ON CONFLICT (endpoint) WHERE partida_id IS NULL DO UPDATE
       SET p256dh = $2, auth = $3`,
      [assinatura.endpoint, assinatura.keys.p256dh, assinatura.keys.auth],
    );
    return;
  }

  await db.query(
    `INSERT INTO push_subscriptions (partida_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (partida_id, endpoint) DO UPDATE
     SET p256dh = $3, auth = $4`,
    [partidaId, assinatura.endpoint, assinatura.keys.p256dh, assinatura.keys.auth],
  );
}

/** Cancela uma inscrição específica (usuário desativou nesse nível — contextual ou global). */
export async function removerInscricao(partidaId: number | null, endpoint: string): Promise<void> {
  if (partidaId === null) {
    await db.query(`DELETE FROM push_subscriptions WHERE partida_id IS NULL AND endpoint = $1`, [
      endpoint,
    ]);
    return;
  }
  await db.query(
    `DELETE FROM push_subscriptions WHERE partida_id = $1 AND endpoint = $2`,
    [partidaId, endpoint],
  );
}

/**
 * Um endpoint inválido (404/410 — navegador revogou a inscrição) está
 * inválido em qualquer nível, não só no que estava sendo enviado agora —
 * limpa a linha contextual e a global de uma vez, em vez de só a que
 * falhou.
 */
async function removerInscricoesInvalidas(endpoint: string): Promise<void> {
  await db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

interface LinhaInscricao {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Inscritos que devem receber um evento desta Partida: os contextuais
 * dela + os globais — deduplicados por `endpoint` (um dispositivo inscrito
 * nos dois níveis não pode receber a mesma notificação duas vezes).
 */
async function buscarInscricoesDaPartida(partidaId: number): Promise<LinhaInscricao[]> {
  const { rows } = await db.query<LinhaInscricao>(
    `SELECT DISTINCT ON (endpoint) endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE partida_id = $1 OR partida_id IS NULL
     ORDER BY endpoint, partida_id NULLS LAST`,
    [partidaId],
  );
  return rows;
}

async function enviarParaInscritos(
  inscritos: LinhaInscricao[],
  payload: string,
): Promise<void> {
  await Promise.allSettled(
    inscritos.map(async (linha) => {
      try {
        await webpush.sendNotification(
          { endpoint: linha.endpoint, keys: { p256dh: linha.p256dh, auth: linha.auth } },
          payload,
        );
      } catch (error) {
        // 404/410 = inscrição expirada ou revogada pelo navegador — limpa
        // do banco. Qualquer outro erro (rede, etc.) só loga e segue: uma
        // notificação perdida não pode derrubar a ação que a disparou.
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removerInscricoesInvalidas(linha.endpoint);
        } else {
          console.error("Falha ao enviar notificação push", error);
        }
      }
    }),
  );
}

/**
 * Notifica quem estiver inscrito nesta Partida que o nível de blind mudou
 * — chamada depois de `pularNivel`/`voltarNivel` (manual) e de
 * `avancarNiveisVencidos` (automático, ver ticket 36), nunca de dentro da
 * transação que grava o Timer (é uma chamada de rede pra fora, não deve
 * segurar nenhum lock nem falhar a mudança de nível se o envio falhar).
 * Sem chaves VAPID configuradas, não faz nada (ver `garantirConfigurado`).
 *
 * Só contextual (não olha inscrição global) — quem está inscrito
 * globalmente quer saber quando *alguma* Partida começa/termina/perde
 * gente, não a troca de blind de uma Partida que talvez nem esteja
 * acompanhando.
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

  await enviarParaInscritos(rows, payload);
}

/**
 * Notifica que a Partida começou (primeiro "Iniciar" do Timer, ver
 * `iniciarTimer` — não dispara de novo em cada retomada depois de uma
 * pausa). Chega pra quem está inscrito nesta Partida e pra quem está
 * inscrito globalmente.
 */
export async function notificarPartidaComecou(partidaId: number): Promise<void> {
  if (!garantirConfigurado()) return;

  const inscritos = await buscarInscricoesDaPartida(partidaId);
  if (inscritos.length === 0) return;

  const payload = JSON.stringify({
    titulo: "Partida começou! 🃏",
    corpo: "O Timer já está rodando — acompanhe o blind ao vivo.",
    url: `/partidas/${partidaId}/timer`,
  });

  await enviarParaInscritos(inscritos, payload);
}

/**
 * Notifica que um Jogador saiu da Partida (chamada a partir de
 * `marcarSaida`), com a posição em que ficou.
 */
export async function notificarJogadorSaiu(
  partidaId: number,
  nomeDoJogador: string,
  posicao: number,
): Promise<void> {
  if (!garantirConfigurado()) return;

  const inscritos = await buscarInscricoesDaPartida(partidaId);
  if (inscritos.length === 0) return;

  const payload = JSON.stringify({
    titulo: `${nomeDoJogador} saiu da Partida`,
    corpo: `Ficou em ${posicao}º lugar.`,
    url: `/partidas/${partidaId}`,
  });

  await enviarParaInscritos(inscritos, payload);
}

/** Uma linha da classificação final, só o que o texto da notificação precisa. */
export interface LinhaDeClassificacao {
  nome: string;
  posicao: number | null;
  pontos: number | null;
}

const MEDALHAS = ["🥇", "🥈", "🥉"];

/**
 * Top 3 da classificação final formatado pro corpo da notificação — função
 * pura (sem I/O), separada só pra ser testável direto sem mock de banco/
 * push. Ignora quem não tem posição (não devia acontecer numa Partida já
 * finalizada, mas não é este código que garante isso).
 */
export function formatarTop3Texto(classificacaoFinal: LinhaDeClassificacao[]): string {
  return [...classificacaoFinal]
    .filter((linha) => linha.posicao !== null)
    .sort((a, b) => a.posicao! - b.posicao!)
    .slice(0, 3)
    .map((linha, indice) => `${MEDALHAS[indice]} ${linha.nome}`)
    .join(" · ");
}

/**
 * Notifica que a Partida terminou (chamada a partir de `finalizarPartida`,
 * que também encerra o Timer — ver ticket 48), com o topo 3 da
 * classificação final no corpo da notificação.
 */
export async function notificarPartidaTerminou(
  partidaId: number,
  classificacaoFinal: LinhaDeClassificacao[],
): Promise<void> {
  if (!garantirConfigurado()) return;

  const inscritos = await buscarInscricoesDaPartida(partidaId);
  if (inscritos.length === 0) return;

  const payload = JSON.stringify({
    titulo: "Partida encerrada! 🏆",
    corpo: formatarTop3Texto(classificacaoFinal) || "Confira a classificação final.",
    url: `/partidas/${partidaId}`,
  });

  await enviarParaInscritos(inscritos, payload);
}
