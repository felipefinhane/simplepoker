"use client";

/**
 * Botão de Iniciar/Pausar do Timer — o mesmo em espírito no card compacto
 * e na tela cheia, só o tamanho muda (`tamanho`).
 */
export function BotaoPlayPause({
  rodando,
  tamanho,
  onClick,
}: {
  rodando: boolean;
  tamanho: "compacto" | "grande";
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
      aria-label={rodando ? "Pausar" : "Iniciar"}
      className={`flex items-center justify-center rounded-full bg-secondary text-on-secondary transition-transform hover:scale-105 ${classesDoBotao}`}
    >
      <span
        className={`material-symbols-outlined ${tamanhoDoIcone}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {rodando ? "pause" : "play_arrow"}
      </span>
    </button>
  );
}
