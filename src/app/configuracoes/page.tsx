import { ToggleNotificacaoGlobal } from "./toggle-notificacao-global";
import { ToggleDaltonismo } from "./toggle-daltonismo";

/**
 * Configurações do app (ticket 54) — pública (sem `requireOrganizador`):
 * são preferências de dispositivo (notificação, modo daltonismo), de
 * quem quer que esteja usando o app, não só o Organizador logado. Por
 * isso mora num ícone próprio no header (ver AppShell), separado do menu
 * de conta.
 */
export default function ConfiguracoesPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Configurações</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Preferências deste dispositivo — ficam salvas só aqui, não na sua conta.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <ToggleNotificacaoGlobal />
        <ToggleDaltonismo />
      </section>
    </main>
  );
}
