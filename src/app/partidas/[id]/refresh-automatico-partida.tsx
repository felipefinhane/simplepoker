"use client";

import { useRefreshAutomatico } from "@/hooks/use-refresh-automatico";

/**
 * Sem UI própria — só liga o polling da página de Partida (ver
 * `useRefreshAutomatico`). Montado uma vez em `page.tsx`, cobre os dois
 * jeitos de ver essa página (editável pro Organizador, só-leitura pros
 * demais), já que os dois são renderizados pelo mesmo Server Component.
 */
export function RefreshAutomaticoPartida({ ativo }: { ativo: boolean }) {
  useRefreshAutomatico(ativo);
  return null;
}
