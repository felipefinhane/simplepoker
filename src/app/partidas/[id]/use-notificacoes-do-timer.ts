"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Preenchido no build (ver next.config.ts / Vercel) — chave pública VAPID. */
const CHAVE_PUBLICA_VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type SuporteDeNotificacao =
  | "verificando"
  | "sem-suporte"
  | "precisa-instalar-no-ios"
  | "ios-desatualizado"
  | "suportado";

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

function detectarSuporte(): SuporteDeNotificacao {
  if (!CHAVE_PUBLICA_VAPID) return "sem-suporte";

  // No iOS, `PushManager` só existe em `window` dentro do app instalado
  // (a API nem é exposta numa aba comum do Safari) — checar isso ANTES do
  // teste genérico de suporte é essencial: senão, todo iPhone que ainda
  // não instalou cai direto em "sem-suporte" (botão some sem explicação)
  // em vez de "precisa-instalar-no-ios" (mostra a dica de instalação).
  if (ehIos()) {
    if (!estaInstaladoComoPwa()) return "precisa-instalar-no-ios";
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // "standalone" bateu, mas falta a API mesmo assim. iOS < 16.4 é uma
      // causa possível, mas não a única — um ícone adicionado à Tela de
      // Início antes de alguma correção de manifest/metadata (ex: tickets
      // 19-22) pode nunca ter sido reconhecido pela Apple como um "app
      // instalado" de verdade pra fins de push, mesmo em iOS mais novo.
      // Reinstalar o ícone costuma resolver — ver mensagem em
      // `botao-notificacao.tsx`, que não afirma "seu iOS é antigo" sem
      // certeza.
      return "ios-desatualizado";
    }
    return "suportado";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "sem-suporte";
  return "suportado";
}

/**
 * Ativar/desativar notificação push de troca de nível pra uma Partida —
 * reaproveitado pelo card compacto e pela tela cheia do Timer. Suporte
 * varia bastante por navegador/OS (ver `SuporteDeNotificacao`), então o
 * componente que usa isso sempre precisa checar `suporte` antes de mostrar
 * o botão.
 */
export function useNotificacoesDoTimer(partidaId: number) {
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

    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager.getSubscription())
      .then((assinatura) => setInscrito(assinatura !== null))
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
      const assinatura = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaUint8Array(CHAVE_PUBLICA_VAPID),
      });

      const resposta = await fetch(`/api/partidas/${partidaId}/timer/notificacoes`, {
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
        await fetch(`/api/partidas/${partidaId}/timer/notificacoes`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: assinatura.endpoint }),
        });
        await assinatura.unsubscribe();
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
