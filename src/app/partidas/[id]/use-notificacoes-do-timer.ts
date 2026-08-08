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

/**
 * Só a parte barata e síncrona: "sem chave VAPID" e "iOS sem estar
 * instalado" dá pra saber na hora. O resto ("o navegador tem PushManager
 * de verdade?") fica pra depois — ver `useNotificacoesDoTimer` — porque
 * checar `"PushManager" in window` direto, cedo demais (antes do service
 * worker terminar de registrar), deu falso-negativo real no Safari do
 * iOS: um app recém-instalado em iOS 16.4+ (confirmado pelo Organizador)
 * apontava "sem suporte" mesmo sendo capaz — o Safari parece só expor a
 * API depois que o service worker fica pronto, diferente do Chrome (onde
 * já existe global desde o início). Checar via `"pushManager" in
 * registro` (na registration, depois de `serviceWorker.ready`) é a forma
 * correta e recomendada pela spec — não depende dessa corrida.
 */
function detectarSuportePrecoce(): SuporteDeNotificacao {
  if (!CHAVE_PUBLICA_VAPID || !("serviceWorker" in navigator)) return "sem-suporte";
  if (ehIos() && !estaInstaladoComoPwa()) return "precisa-instalar-no-ios";
  return "verificando"; // ainda precisa confirmar depois que o service worker ficar pronto
}

/**
 * Ativar/desativar notificação push de troca de nível pra uma Partida —
 * reaproveitado pelo card compacto e pela tela cheia do Timer. Suporte
 * varia bastante por navegador/OS (ver `SuporteDeNotificacao`), então o
 * componente que usa isso sempre precisa checar `suporte` antes de mostrar
 * o botão.
 */
export function useNotificacoesDoTimer(partidaId: number) {
  // `useSyncExternalStore` (não `useEffect` + `setState`) porque a parte
  // síncrona é um valor de fora do React (capacidade do navegador) que
  // nunca muda depois de montado — `getServerSnapshot` mantém a SSR
  // segura ("verificando", sem tocar em `navigator`/`window` no servidor).
  const suportePrecoce = useSyncExternalStore(
    inscreverEmNada,
    detectarSuportePrecoce,
    () => "verificando" as SuporteDeNotificacao,
  );
  const [suporteConfirmado, setSuporteConfirmado] = useState<SuporteDeNotificacao | null>(null);
  // "sem-suporte"/"precisa-instalar-no-ios" já são finais (não passam por
  // aqui); só "verificando" espera a confirmação assíncrona abaixo.
  const suporte = suporteConfirmado ?? suportePrecoce;

  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (suportePrecoce !== "verificando") return;

    navigator.serviceWorker.ready
      .then((registro) => {
        const suportado = "pushManager" in registro;
        setSuporteConfirmado(suportado ? "suportado" : ehIos() ? "ios-desatualizado" : "sem-suporte");
        if (!suportado) return;
        return registro.pushManager
          .getSubscription()
          .then((assinatura) => setInscrito(assinatura !== null));
      })
      .catch(() => {
        setSuporteConfirmado(ehIos() ? "ios-desatualizado" : "sem-suporte");
      });
  }, [suportePrecoce]);

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
