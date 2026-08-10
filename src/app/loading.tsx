import { IconeCarregando } from "@/components/icone-carregando";

/**
 * Fallback automático do Next.js (App Router) enquanto a página de destino
 * — um Server Component buscando dados do banco — ainda está carregando,
 * mostrado durante a navegação entre rotas (bottom nav, links, etc). Sem
 * isso, o clique em qualquer item de menu não dava feedback nenhum até a
 * página nova terminar de renderizar — parecia que "não tinha feito nada"
 * (ver ticket 41, que resolveu o mesmo problema pros botões de ação, mas
 * não cobria navegação de página). Um `loading.tsx` na raiz cobre a troca
 * entre as rotas de nível principal (Ranking, Partidas, Blinds, Caixa,
 * Histórico); não existem `loading.tsx` mais específicos porque nenhuma
 * dessas páginas tem uma consulta lenta o bastante pra precisar de um
 * esqueleto próprio — o spinner genérico já é suficiente.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <IconeCarregando tamanho={40} className="text-primary" />
    </div>
  );
}
