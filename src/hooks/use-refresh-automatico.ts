"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVALO_MS = 5000;

/**
 * Atualiza a página (Server Component, via `router.refresh()`) sozinha, em
 * intervalos, enquanto `ativo` — pra quem está só olhando uma Partida ao
 * vivo (Organizador ou não) ver o resultado/ranking mudando conforme
 * alguém lança, sem precisar de F5 manual (ticket 52). Escopo combinado
 * com o Organizador: só a tela de Partida ao vivo, não o app inteiro — o
 * Timer já tem o próprio polling mais curto (`use-timer.ts`), esse aqui é
 * só pro resto (Lançamentos, projeção de ranking do ticket 50).
 *
 * Pausa quando a aba não está visível (Page Visibility API) — sem isso,
 * gastaria bateria/dados à toa com o celular no bolso — e força uma
 * atualização na hora ao voltar a ficar visível, pra não deixar dado
 * velho na tela por até `INTERVALO_MS` depois de reabrir.
 */
export function useRefreshAutomatico(ativo: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!ativo) return;

    function talvezAtualizar() {
      if (document.visibilityState === "visible") router.refresh();
    }

    const intervalo = setInterval(talvezAtualizar, INTERVALO_MS);
    document.addEventListener("visibilitychange", talvezAtualizar);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", talvezAtualizar);
    };
  }, [ativo, router]);
}
