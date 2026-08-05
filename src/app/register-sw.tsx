"use client";

import { useEffect } from "react";

/**
 * Registra o service worker mínimo (public/sw.js) que torna o app
 * instalável como PWA. Sem cache/offline por enquanto — ver public/sw.js.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Falha ao registrar o service worker", error);
      });
    }
  }, []);

  return null;
}
