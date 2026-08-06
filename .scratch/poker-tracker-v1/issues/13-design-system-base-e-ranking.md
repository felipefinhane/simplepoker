# 13 — Base do design system (Tailwind + AppShell) e reskin do Ranking

**What to build:** Primeira fatia do redesign mobile-first pedido pelo Organizador, a partir das telas geradas no Google Stitch (ver `.scratch/poker-tracker-v1/stitch-prompt.md` e `stitch-output-raw.html`). Instala o Tailwind CSS, porta o design system do Stitch (cores/fontes/espaçamentos, tema escuro único — o app não tem alternância de tema) pro projeto, monta a casca da aplicação (barra superior + navegação — bottom nav no mobile, side nav no desktop) e reskina a primeira tela (Ranking/Home) usando tudo isso.

**Blocked by:** Nenhum ticket específico — trabalho de UX/design solicitado depois da v1 e dos tickets 10-12 (correções funcionais), como planejado.

**Status:** ready-for-agent

- [x] Tailwind CSS v4 instalado (`tailwindcss` + `@tailwindcss/postcss`), tema definido via `@theme` em `globals.css` com os tokens exatos do Stitch (cores, fontes, tamanhos de texto com peso/espaçamento, espaçamentos nomeados, raios de borda)
- [x] Fontes trocadas de Geist pra Hanken Grotesk (texto) + JetBrains Mono (dados/números), via `next/font/google` — mesmo padrão já usado antes
- [x] Ícones Material Symbols Outlined disponíveis em todo o app
- [x] `AppShell` (`src/components/app-shell.tsx`): barra superior (logo + link pra conta), bottom nav fixo no mobile e side nav no desktop, com 4 itens públicos (Ranking/Partidas/Caixa/Histórico) e um menu de conta que muda conforme o Organizador está ou não autenticado (login vs. Jogadores/Temporada/Trocar senha/Sair)
- [x] `RankingsDaTemporada` reskinado: pódio (top 3) pro Ranking de Pontuação, lista pras posições 4+, card do Ranking Carrasco (só Almas, ver ticket 12) e lista de Últimas Partidas — usado tanto pela Home quanto pelo Histórico de Temporada
- [x] Home (`/`) reskinada usando os componentes acima
- [x] Verificado visualmente (screenshot real via Chromium headless) em mobile (390px) e desktop (1280px) com dados de uma Partida finalizada de verdade

**Decisões de design**:
- Só existe tema escuro — o Stitch só gerou tokens de cor pro modo escuro (o app é usado numa mesa de poker, geralmente com pouca luz), então não tem alternância de tema nem media query de `prefers-color-scheme` claro/escuro.
- `AppShell` faz `getOrganizadorLogado()` no layout raiz (Server Component) e passa pro componente de navegação (Client Component, por causa do `usePathname` pro estado ativo e do menu de conta) — isso torna toda página do app dinâmica (renderizada por requisição, nunca estática), o que também evita de vez a classe de bug do deploy do ticket 10 (consulta ao banco rodando em tempo de build contra um schema ainda não migrado).
- `AppShell` envolve o conteúdo num `<div>`, não em `<main>` — cada página continua sendo dona do próprio `<main>` (evita landmark `<main>` duplicado); páginas ainda não reskinadas continuam com o `<main>` antigo (funcional, só sem o visual novo) até chegar a vez delas nos próximos tickets.
- Duas variantes de tela que vieram do Stitch foram descartadas por fugirem da marca (inglês, paleta diferente, fotos de banco de imagem) — não fazem parte deste ticket nem dos próximos.
- `historico/[id]/page.tsx` recebeu um ajuste mínimo de consistência (título e link com os tokens novos) além do necessário pra passar `participantes` — decisão consciente: deixar o `<main>` antigo (texto/link no estilo padrão do navegador) logo acima do `RankingsDaTemporada` já reskinado ficaria visualmente quebrado, não só "sem o visual novo". O reskin completo dessa página (pódio com fotos, stats da Temporada, compartilhar) ainda fica pro ticket de Histórico.
- Próximos tickets (mesma leva de trabalho, ainda não feitos): Partida em andamento + Timer, Caixa + Histórico (lista e detalhe), Jogadores + Temporada/Parâmetros + Login + Nova Partida + Lista de Partidas (as quatro últimas não vieram do Stitch — serão desenhadas no mesmo sistema direto no código).

**Achados do `/code-review` e correções aplicadas antes de commitar**:
- `AppShell` recebia um tipo `{ nome: string }` reinventado pro Organizador — trocado por `import type { Organizador }` de `@/lib/auth/organizador` (`Pick<Organizador, "nome">`).
- O ícone de conta abria um menu de 1 item ("Entrar como Organizador") quando deslogado — o prompt original pedia "leva pro Login quando ninguém está autenticado, ou revela um menu quando o Organizador está logado", ou seja, dois comportamentos distintos, não um menu sempre. Corrigido: deslogado, o ícone é um link direto pra `/login`; logado, abre o menu.
- Duplicação entre a side nav e a bottom nav (o mesmo `.map()` com JSX quase idêntico) — extraída em `ItemDeNavegacao`, parametrizada por `variante`.
- O elemento invisível que fecha o menu ao clicar fora era um `<button aria-hidden tabIndex={-1}>` — `aria-hidden` num elemento interativo é um antipadrão de ARIA; trocado por um `<div onClick>` sem nenhuma semântica de controle (não precisa ser focável nem anunciado, só captura o clique).
