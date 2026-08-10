"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconeCarregando } from "@/components/icone-carregando";

/**
 * Reabre uma Temporada encerrada (ticket 45) — pra quando encerrar foi
 * engano, ou vai ter mais uma Partida nela. Só o Organizador vê este
 * botão (gate no page.tsx). Confirmação simples (`confirm()`), não a
 * digitada tipo "ENCERRAR" — é a direção "seguro" da ação, ao contrário
 * de encerrar (ver `ModalEncerrarTemporada`).
 */
export function ReabrirTemporadaButton({ temporadaId }: { temporadaId: number }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function reabrir() {
    if (
      !confirm(
        "Reabrir esta Temporada? Ela volta a ficar editável, e novas Partidas podem ser lançadas nela — só funciona se não houver nenhuma outra Temporada aberta agora.",
      )
    ) {
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch(`/api/temporadas/${temporadaId}/reabrir`, {
        method: "POST",
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível reabrir.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={reabrir}
        disabled={enviando}
        className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-label-sm font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {enviando ? (
          <IconeCarregando tamanho={16} />
        ) : (
          <span className="material-symbols-outlined text-[18px]">lock_open</span>
        )}
        Reabrir Temporada
      </button>
      {erro && <p className="text-label-sm text-error">{erro}</p>}
    </div>
  );
}
