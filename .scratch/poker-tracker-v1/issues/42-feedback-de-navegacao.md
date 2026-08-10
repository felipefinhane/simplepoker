# 42 — Feedback ao navegar entre páginas (menu/links)

**What to build:** Organizador testou o ticket 41 e não sentiu diferença clicando nos itens do menu, nem viu nenhum indicador de carregamento — o ticket 41 cobriu botões de ação (`<button>`), mas a navegação entre páginas (bottom nav, cards, links "Ver mais") usa `<Link>` do Next.js, que renderiza `<a>`, não `<button>` — nem o efeito de toque nem o spinner cobriam esse caminho.

**Blocked by:** 41

**Status:** done

- [x] `globals.css`: efeito de toque (`:active` → encolhe um pouco) estendido pra `a[href]`, não só `<button>` — cobre bottom nav, side nav, cards de Partida/Histórico, links "Ver mais"/"Voltar", etc., sem precisar tocar em cada um
- [x] `src/app/loading.tsx` (novo): fallback automático do Next.js (App Router) durante a navegação — cada página é um Server Component buscando dados do banco; sem um `loading.tsx`, a página antiga ficava parada na tela até a nova terminar de carregar, sem feedback nenhum. Um `loading.tsx` na raiz mostra um spinner centralizado enquanto isso, cobrindo a troca entre as rotas principais (Ranking, Partidas, Blinds, Caixa, Histórico) — não precisou de um por rota porque nenhuma delas tem consulta lenta o bastante pra justificar um esqueleto próprio
- [x] Verificado via CDP com a rede propositalmente lenta (3G simulado): o spinner do `loading.tsx` aparece corretamente durante a navegação, com o bottom nav já destacando o destino (comportamento padrão do Next.js, otimista)
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
