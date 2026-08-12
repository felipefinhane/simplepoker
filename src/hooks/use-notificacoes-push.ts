"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Preenchido no build (ver next.config.ts / Vercel) — chave pública VAPID. */
const CHAVE_PUBLICA_VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type SuporteDeNotificacao = "verificando" | "sem-suporte" | "precisa-instalar-no-ios" | "suportado";

/** applicationServerKey do PushManager exige `Uint8Array`, não a string base64url da chave. */
function base64UrlParaUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bruto = atob(base64);
  // `new Uint8Array(length)` (em vez de `.from()`) aloca um ArrayBuffer
  // próprio — o tipo do DOM pra `applicationServerKey` exige exatamente
  // isso, não o `ArrayBufferLike` mais genérico que `.from()` produz.
  const bytes = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) {
    bytes[i] = bruto.charCodeAt(i);
  }
  return bytes;
}

/** iOS só entrega push pro PWA instalado (Adicionar à Tela de Início) — Safari "solto" nunca recebe. */
function estaInstaladoComoPwa(): boolean {
  const standaloneNoIos = (navigator as unknown as { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || standaloneNoIos === true;
}

function ehIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Nunca muda depois de montado — `useSyncExternalStore` não precisa de inscrição de verdade. */
function inscreverEmNada() {
  return () => {};
}

/**
 * Decisão só com checagens síncronas e confiáveis — nada que dependa de
 * esperar o service worker "ficar pronto" antes de decidir se mostra o
 * botão. Duas tentativas anteriores tentaram confirmar `PushManager` de
 * antemão (via `"PushManager" in window`, depois via `"pushManager" in
 * registro` depois de `serviceWorker.ready`) e as duas deram problema real
 * no Safari do iOS: a primeira, falso-negativo (checava cedo demais); a
 * segunda, o botão sumia de vez quando `serviceWorker.ready` nunca
 * resolvia (visto num app recém-reinstalado, sem nenhum motivo aparente).
 * Mais simples e mais robusto: no iOS, se estiver instalado, mostra o
 * botão — é exatamente o que a Apple documenta como suficiente (iOS
 * 16.4+, standalone). Se `PushManager` realmente não existir, o próprio
 * clique em "Ativar" (`ativar()` abaixo) vai falhar e mostrar um erro
 * claro, em vez do botão simplesmente nunca aparecer.
 */
function detectarSuporte(): SuporteDeNotificacao {
  if (!CHAVE_PUBLICA_VAPID || !("serviceWorker" in navigator)) return "sem-suporte";
  if (ehIos()) return estaInstaladoComoPwa() ? "suportado" : "precisa-instalar-no-ios";
  if (!("PushManager" in window)) return "sem-suporte";
  return "suportado";
}

/** Endpoint de inscrição: contextual (dessa Partida) ou global (qualquer Partida, ticket 48). */
function urlDeInscricao(partidaId: number | null): string {
  return partidaId === null
    ? "/api/notificacoes/inscricao"
    : `/api/partidas/${partidaId}/timer/notificacoes`;
}

/**
 * Ativar/desativar notificação push — dois usos:
 * - **Contextual** (`partidaId` de verdade): troca de nível de blind
 *   dessa Partida — reaproveitado pelo card compacto e pela tela cheia do
 *   Timer (ticket 39).
 * - **Global** (`partidaId: null`): partida começou/terminou/jogador saiu
 *   de qualquer Partida — usado na tela de Configurações (ticket 48/54).
 *
 * Suporte varia bastante por navegador/OS (ver `SuporteDeNotificacao`),
 * então o componente que usa isso sempre precisa checar `suporte` antes de
 * mostrar o botão.
 */
export function useNotificacoesPush(partidaId: number | null) {
  // `useSyncExternalStore` (não `useEffect` + `setState`) porque é um
  // valor de fora do React (capacidade do navegador) que nunca muda depois
  // de montado — `getServerSnapshot` mantém a SSR segura ("verificando",
  // sem tocar em `navigator`/`window` no servidor).
  const suporte = useSyncExternalStore(
    inscreverEmNada,
    detectarSuporte,
    () => "verificando" as SuporteDeNotificacao,
  );
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (suporte !== "suportado") return;

    // Só refina o rótulo do botão (inscrito ou não) — não decide se ele
    // aparece, então não tem problema se demorar ou nunca resolver.
    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager?.getSubscription())
      .then((assinatura) => setInscrito(assinatura != null))
      .catch(() => {
        // Sem service worker pronto ainda — segue como "não inscrito".
      });
  }, [suporte]);

  async function ativar() {
    if (!CHAVE_PUBLICA_VAPID) return;
    setErro(null);
    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setErro("Permissão de notificação negada.");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      if (!registro.pushManager) {
        // Só descoberto aqui, na hora de tentar — ver comentário em
        // `detectarSuporte`. No iOS, ausência real disso costuma ser
        // versão anterior a 16.4 (às vezes precisa reinstalar o ícone
        // depois de atualizar o iOS, não só atualizar o sistema).
        setErro(
          "Notificação indisponível neste app. No iOS, exige 16.4 ou mais novo — se já estiver atualizado, tente remover e reinstalar o ícone da Tela de Início.",
        );
        return;
      }

      // `subscribe()` é idempotente: se o navegador já tem uma inscrição
      // ativa pra essa `applicationServerKey` (ex: já ativou a
      // notificação contextual de outra Partida, ou a global), devolve a
      // mesma sem recriar — é assim que a mesma `endpoint` acaba servindo
      // tanto pra inscrição contextual quanto pra global (ver dedupe em
      // `buscarInscricoesDaPartida`, `src/lib/push.ts`).
      const assinatura = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaUint8Array(CHAVE_PUBLICA_VAPID),
      });

      const resposta = await fetch(urlDeInscricao(partidaId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assinatura.toJSON()),
      });
      if (!resposta.ok) throw new Error("Não foi possível salvar a inscrição.");
      setInscrito(true);
    } catch {
      setErro("Não foi possível ativar a notificação.");
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setErro(null);
    setCarregando(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const assinatura = await registro.pushManager.getSubscription();
      if (assinatura) {
        await fetch(urlDeInscricao(partidaId), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: assinatura.endpoint }),
        });
        // Propositalmente **não** chama `assinatura.unsubscribe()`: isso
        // derrubaria o endpoint inteiro no navegador, que agora pode estar
        // servindo dois níveis ao mesmo tempo (contextual e global, ver
        // ticket 48) — desativar um não pode matar o outro. Só apaga a
        // linha deste nível no servidor; a inscrição do navegador em si
        // fica pronta pra ser reaproveitada (`subscribe()` é idempotente,
        // ver `ativar()`).
      }
      setInscrito(false);
    } catch {
      setErro("Não foi possível desativar a notificação.");
    } finally {
      setCarregando(false);
    }
  }

  return {
    suporte,
    inscrito,
    carregando,
    erro,
    alternar: () => (inscrito ? desativar() : ativar()),
  };
}
