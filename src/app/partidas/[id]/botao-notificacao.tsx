"use client";

import { useState } from "react";
import { useNotificacoesDoTimer } from "./use-notificacoes-do-timer";

/**
 * Ativa/desativa notificação push de troca de nível — em cima do beep
 * (`use-timer.ts`, ticket 37), que só funciona com a aba aberta em
 * primeiro plano. Reaproveitado pelo card compacto e pela tela cheia do
 * Timer (ticket 39). Sempre renderizado fora de qualquer `<Link>` — clicar
 * aqui não pode disparar a navegação do card/tela cheia por baixo.
 */
export function BotaoNotificacao({
  partidaId,
  sobreFundoEscuro = false,
  className = "",
}: {
  partidaId: number;
  /** Card compacto do Timer tem fundo verde escuro — precisa de cor clara em cima. */
  sobreFundoEscuro?: boolean;
  className?: string;
}) {
  const { suporte, inscrito, carregando, erro, alternar } = useNotificacoesDoTimer(partidaId);
  const [mostrarDicaIos, setMostrarDicaIos] = useState(false);

  if (suporte === "verificando" || suporte === "sem-suporte") return null;

  const corInativa = sobreFundoEscuro
    ? "text-on-primary/70 hover:bg-white/10"
    : "text-on-surface-variant hover:bg-surface-container-high";

  if (suporte === "precisa-instalar-no-ios") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setMostrarDicaIos((atual) => !atual)}
          aria-label="Notificação indisponível — instale o app primeiro"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${corInativa}`}
        >
          <span className="material-symbols-outlined text-[20px]">notifications_off</span>
        </button>
        {mostrarDicaIos && (
          <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-outline-variant bg-surface-container-high p-3 text-label-sm text-on-surface shadow-lg">
            Pra receber notificação quando o blind mudar, instale o app na Tela de Início primeiro
            (Compartilhar → Adicionar à Tela de Início).
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={carregando}
      aria-label={inscrito ? "Desativar notificação de blind" : "Ativar notificação de blind"}
      title={erro ?? undefined}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
        inscrito ? "bg-secondary/20 text-secondary" : corInativa
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">
        {inscrito ? "notifications_active" : "notifications"}
      </span>
    </button>
  );
}
