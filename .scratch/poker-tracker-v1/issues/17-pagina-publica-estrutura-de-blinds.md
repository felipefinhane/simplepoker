# 17 — Página pública da Estrutura de Blinds

**What to build:** Uma página pública, sem login, mostrando a Estrutura de Blinds da Temporada atual — a lista de níveis (small/big blind e duração) configurada nos Parâmetros da Temporada — pra quem quer conferir os valores/tempos sem precisar estar numa Partida em andamento (ex: planejar a noite, conferir a duração total). Diferente do Timer (ticket 09/14), que é o cronômetro ao vivo de uma Partida específica: esta é só a tabela de referência, estática.

**Blocked by:** 05 (Parâmetros e ciclo da Temporada — é de lá que vem a Estrutura de Blinds)

**Status:** done

- [x] Nova rota pública `/blinds` listando os níveis da Estrutura de Blinds da Temporada aberta: nº do nível, small/big blind, duração, e duração acumulada até ali
- [x] Acessível sem login, igual às demais páginas públicas (Ranking, Histórico, Caixa, Partidas)
- [x] Estado vazio tratado: sem Temporada aberta, ou Temporada aberta sem Estrutura de Blinds definida ainda
- [x] Link de acesso: virou o 5º item do `AppShell` (side nav no desktop, bottom nav no mobile) — testado visualmente que os 5 itens continuam cabendo sem quebrar em 390px; também um link de volta pra "Ver Partidas" no rodapé da própria página
- [x] Verificado visualmente (screenshot) em mobile (390px) e desktop (1280px), com Estrutura de Blinds real (4 níveis); `npm test` (50/50), lint e `tsc --noEmit` limpos

**Notas:**
- Não é a mesma coisa que o card/tela cheia do Timer (que mostra o nível *atual* de uma Partida rodando) — reaproveitar aqui é só leitura dos Parâmetros da Temporada, sem nenhum estado de `partida_timers`.
- Reusar o mesmo componente de tabela/lista se fizer sentido, mas como visualização estática (sem os controles de play/pause/pular do Organizador).
