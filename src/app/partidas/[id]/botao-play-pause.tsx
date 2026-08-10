"use client";

import { IconeCarregando } from "@/components/icone-carregando";

/**
 * Botão de Iniciar/Pausar do Timer — o mesmo em espírito no card compacto
 * e na tela cheia, só o tamanho muda (`tamanho`).
 */
export function BotaoPlayPause({
  rodando,
  tamanho,
  carregando = false,
  desabilitado = false,
  onClick,
}: {
  rodando: boolean;
  tamanho: "compacto" | "grande";
  /** Mostra o spinner nesse botão — implica desabilitado. */
  carregando?: boolean;
  /** Desabilita sem mostrar spinner aqui (outra ação do Timer está rodando). */
  desabilitado?: boolean;
  onClick: () => void;
}) {
  const classesDoBotao =
    tamanho === "grande"
      ? "-mt-6 h-20 w-20 shadow-[0_0_24px_rgba(233,195,73,0.3)] active:scale-95"
      : "h-16 w-16 shadow-lg";
  const tamanhoDoIcone = tamanho === "grande" ? "text-[40px]" : "text-4xl";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando || desabilitado}
      aria-label={rodando ? "Pausar" : "Iniciar"}
      className={`flex items-center justify-center rounded-full bg-secondary text-on-secondary transition-transform hover:scale-105 disabled:opacity-70 ${classesDoBotao}`}
    >
      {carregando ? (
        <IconeCarregando tamanho={tamanho === "grande" ? 40 : 36} />
      ) : (
        <span
          className={`material-symbols-outlined ${tamanhoDoIcone}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {rodando ? "pause" : "play_arrow"}
        </span>
      )}
    </button>
  );
}
