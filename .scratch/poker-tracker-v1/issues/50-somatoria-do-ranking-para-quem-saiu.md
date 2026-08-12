# 50 — Somatória do ranking pra quem saiu da Partida

**What to build:** Hoje, quando um Jogador sai da Partida (`marcarSaida`), a UI já mostra a pontuação que ele ganhou naquela noite. Pedido: além disso, mostrar a **somatória com o Ranking de Pontuação da Temporada** — ou seja, qual seria a pontuação (e posição) final dele no Ranking geral se a Temporada fosse fechada com o resultado desta Partida, pra ele já saber onde ficaria.

**Blocked by:** Nenhum.

**Status:** done

- [x] Nova função `calcularProjecaoDeRanking(temporadaId, jogadorId, pontosDestaPartida)` em `src/lib/rankings.ts` — reaproveita `calcularRankingsDaTemporada` (só Partidas finalizadas) pra pegar o total oficial atual do Jogador (0 se ele ainda não tem nenhuma Partida finalizada na Temporada) e soma com os pontos desta Partida
- [x] Mostra só o **total projetado**, não uma posição no ranking — decisão tomada durante a implementação (o ticket deixava as duas opções em aberto): projetar a posição exigiria recalcular o ranking inteiro considerando que os demais participantes ainda ativos podem terminar com mais pontos e mudar a ordem — mostrar uma posição ainda não definitiva enganaria mais do que ajudaria. O pedido original ("saber qual será a pontuação ao encerramento") já fica atendido só com o total.
- [x] UI deixa claro que é uma **projeção**: linha extra "→ X pts na Temporada" abaixo dos pontos da Partida, tanto na visão editável do Organizador (`LinhaDeLancamento`, `partida-em-andamento-client.tsx`) quanto na visão só-leitura de quem está só olhando (`ResultadoDaPartida`, `page.tsx`) — só aparece pra quem já tem Posição definida (já saiu) e só enquanto a Partida ainda não foi finalizada (depois de finalizada, o Ranking oficial já é o resultado de verdade, mostrar "projeção" ali seria redundante/confuso)
- [x] Teste de unidade: não fazia sentido isolado (a função é uma combinação simples de duas coisas já testadas — `calcularRankingsDaTemporada` e uma soma). Testado via integração: `test/integration/rankings.integration.test.ts`, 2 casos novos (soma com total já oficial existente; base 0 pra quem ainda não jogou na Temporada) + o caso de Temporada inexistente

## Comments

Verificado ponta a ponta contra o Postgres do Docker: Jogador com 12 pts já oficiais na Temporada, sai de uma nova Partida com 10 pts → tela mostra "→ 22 pts na Temporada" corretamente, tanto pro Organizador quanto pra quem só está olhando (sem login). `npm test` (58/58), `npm run test:integration` (91/91, incluindo os 3 casos novos de `calcularProjecaoDeRanking`), lint e `tsc --noEmit` limpos.
