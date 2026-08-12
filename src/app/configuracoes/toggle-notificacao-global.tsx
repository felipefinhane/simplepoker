"use client";

import { useNotificacoesPush } from "@/hooks/use-notificacoes-push";
import { IconeCarregando } from "@/components/icone-carregando";

/**
 * Interruptor global de notificação (ticket 48) — "avisar sempre que uma
 * Partida começar/terminar/perder gente", sem precisar já estar com a tela
 * dela aberta. Convive com o botão contextual que já existe na tela do
 * Timer (`BotaoNotificacao`) — os dois usam o mesmo hook
 * (`useNotificacoesPush`), só que este aqui com `partidaId: null`.
 */
export function ToggleNotificacaoGlobal() {
  const { suporte, inscrito, carregando, erro, alternar } = useNotificacoesPush(null);

  if (suporte === "verificando") return null;

  if (suporte === "sem-suporte") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-surface-container-high bg-surface-container-low p-4 opacity-60">
        <span className="material-symbols-outlined text-on-surface-variant">notifications_off</span>
        <span>
          <span className="block text-body-md text-on-surface">Notificações</span>
          <span className="block text-label-sm text-on-surface-variant">
            Não disponível neste navegador.
          </span>
        </span>
      </div>
    );
  }

  if (suporte === "precisa-instalar-no-ios") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-surface-container-high bg-surface-container-low p-4">
        <span className="material-symbols-outlined text-on-surface-variant">notifications_off</span>
        <span>
          <span className="block text-body-md text-on-surface">Notificações</span>
          <span className="block text-label-sm text-on-surface-variant">
            Instale o app na Tela de Início primeiro (Compartilhar → Adicionar à Tela de Início).
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={inscrito}
        onClick={alternar}
        disabled={carregando}
        className="flex w-full items-center justify-between gap-4 rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container disabled:opacity-50"
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">
            {inscrito ? "notifications_active" : "notifications"}
          </span>
          <span>
            <span className="block text-body-md text-on-surface">Notificações</span>
            <span className="block text-label-sm text-on-surface-variant">
              Avisa quando uma Partida começar, terminar ou alguém sair — de qualquer Partida, não
              só a que você está olhando.
            </span>
          </span>
        </span>
        {carregando ? (
          <IconeCarregando />
        ) : (
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              inscrito ? "bg-primary" : "bg-surface-container-highest"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-surface transition-transform ${
                inscrito ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        )}
      </button>
      {erro && <p className="px-1 text-label-sm text-error">{erro}</p>}
    </div>
  );
}
