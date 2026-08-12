import { linkDoWhatsapp } from "@/lib/whatsapp";

/**
 * Link `wa.me` com o texto já pronto (ticket 51) — sem JS nenhum no
 * cliente, é só uma âncora: o navegador/OS decide se abre o app do
 * WhatsApp (celular) ou o WhatsApp Web (desktop). `mensagem` já vem
 * formatada de `src/lib/whatsapp.ts`.
 */
export function BotaoExportarWhatsapp({
  mensagem,
  className = "",
}: {
  mensagem: string;
  className?: string;
}) {
  return (
    <a
      href={linkDoWhatsapp(mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-label-sm font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-on-primary ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">share</span>
      Exportar pro WhatsApp
    </a>
  );
}
