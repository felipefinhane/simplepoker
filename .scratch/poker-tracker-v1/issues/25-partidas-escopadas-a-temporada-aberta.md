# 25 — Lista de Partidas escopada à Temporada aberta

**What to build:** Depois da importação da Temporada 2026.1 (ticket 24), `/partidas` passou a misturar as 17 Partidas históricas com as da Temporada aberta de verdade — confuso pra quem só quer ver o que está rolando agora. `/partidas` deve mostrar só as Partidas da Temporada **aberta**; Partidas de uma Temporada encerrada só aparecem ao entrar nela pelo Histórico (`/historico/[id]`).

**Blocked by:** 15 (lista de Partidas pública), 24 (foi o que expôs o problema)

**Status:** done

- [x] `/partidas` trocou `listarPartidas()` (todas, de qualquer Temporada) por `buscarTemporadaAberta()` + `listarPartidasDaTemporada(id)` — só a Temporada aberta
- [x] Sem Temporada aberta: mensagem própria ("Nenhuma Temporada aberta... Partidas de Temporadas encerradas ficam no Histórico", com link) no lugar de "Nenhuma Partida ainda" — e o botão "+ Nova" some junto (não faz sentido sem Temporada aberta pra criar Partida nela)
- [x] `/historico/[id]` já mostrava as Partidas daquela Temporada específica (via `RankingsDaTemporada`/`Últimas Partidas`, ticket 07/13) — não precisou de mudança, só parou de ser duplicado em `/partidas`
- [x] Verificado localmente: com uma Temporada aberta nova + 1 Partida, `/partidas` mostra só essa 1 — as 17 da Temporada encerrada (importada no ticket 24) não aparecem mais ali; `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** `GET /api/partidas` (usado só internamente, sem consumidor no client hoje) continua listando todas as Partidas de qualquer Temporada — não mudei, é uma rota da API pra Organizador autenticado, sem o mesmo problema de exibição pública; revisitar se algum dia ganhar um consumidor que precise do mesmo escopo.
