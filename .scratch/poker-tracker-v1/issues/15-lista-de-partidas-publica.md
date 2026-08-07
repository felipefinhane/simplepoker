# 15 — Lista de Partidas pública

**What to build:** A lista de Partidas (`/partidas`) deixa de exigir login — vira dual-modo, igual ao detalhe de uma Partida (ticket 07): qualquer visitante vê a lista (data, participantes, status em andamento/finalizada) e navega pro detalhe de cada uma; só o Organizador autenticado vê o botão "+ Nova Partida".

**Blocked by:** Nenhum ticket específico — `listarPartidas` (ticket 06) e o padrão dual-modo de acesso público (ticket 07) já existem; falta só aplicar o mesmo padrão nesta página, hoje presa atrás de `redirect("/login")`.

**Status:** done

- [x] `/partidas` acessível sem login — removido o `redirect` condicionado a `getOrganizadorLogado()` em `src/app/partidas/page.tsx`
- [x] "+ Nova Partida" só aparece pro Organizador logado; visitante vê só a lista e os links de detalhe
- [x] Reskin da página usando o design system (ticket 13/14) — card por Partida (data, contagem de participantes, badge "Em andamento"), mesmo padrão visual de `RankingsDaTemporada`/`Últimas Partidas`
- [x] Verificado visualmente (screenshot, mobile 390px) como visitante e como Organizador, com Partida real criada localmente; `npm test` (50/50) e `npx tsc --noEmit` limpos

**Notas:**
- Não confundir com a Estrutura de Blinds pública (ticket 17) — esta página lista as Partidas em si (histórico + em andamento da Temporada atual), não os níveis de blind.
- A aba "Matches" do `AppShell` já aponta pra `/partidas` — hoje ela é inacessível pra quem não está logado, o que é a própria motivação deste ticket.
