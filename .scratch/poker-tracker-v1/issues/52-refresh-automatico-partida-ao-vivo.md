# 52 — Refresh automático na Partida ao vivo

**What to build:** A página de Partida em andamento/Timer já atualiza por polling leve (ver decisão de arquitetura no `spec.md`). Pedido: garantir que o Ranking parcial (ticket 50) e o estado da Partida realmente atualizem sozinhos na tela, sem precisar de F5 manual. Escopo confirmado com o Organizador: só a tela de Partida ao vivo, não o app inteiro.

**Blocked by:** Nenhum (implementado depois do 50, que introduz o Ranking parcial que também precisa entrar no polling).

**Status:** done

- [x] O polling "leve" que já existe (`spec.md`) é só do Timer (`use-timer.ts`, a cada 3s, via `/api/partidas/[id]/timer`) — os Lançamentos/pontos/Ranking parcial da própria página **não** tinham nenhum polling, só atualizavam depois de uma ação do próprio usuário (`router.refresh()` pontual em `finalizar()`). Esse era o buraco real que este ticket fecha.
- [x] Novo hook `useRefreshAutomatico(ativo)` (`src/hooks/use-refresh-automatico.ts`) — chama `router.refresh()` (Server Component) a cada 5s enquanto `ativo`; componente-wrapper sem UI própria (`RefreshAutomaticoPartida`, `src/app/partidas/[id]/refresh-automatico-partida.tsx`) montado uma vez em `page.tsx`, cobre os dois jeitos de ver a página (editável pro Organizador, só-leitura pros demais) de uma vez só
- [x] `ativo = !partida.finalizada` — para de fazer polling assim que a Partida termina, não tem mais nada mudando
- [x] Pausa quando a aba não está visível (`document.visibilityState`/`visibilitychange`) e força uma atualização na hora ao voltar a ficar visível, pra não ficar até 5s com dado velho depois de reabrir o app
- [x] **Achado durante a implementação**: `router.refresh()` sozinho não bastava — `PartidaEmAndamentoClient` guarda sua própria cópia local de `partida`/`jogadoresForaDaPartida` em `useState`, que só usa o valor do prop na primeira montagem; sem sincronizar, o refresh automático atualizaria os props do Server Component mas a tela do Organizador continuaria mostrando os dados antigos. Corrigido ajustando o estado **durante a renderização** (comparando o prop novo com uma cópia do prop anterior guardada em outro `useState`) — não num `useEffect` chamando `setState`, que o lint deste projeto rejeita (`react-hooks/set-state-in-effect`); é o padrão que o próprio React recomenda pra "ajustar estado quando um prop muda" sem efeito. A visão só-leitura (`ResultadoDaPartida`) não precisou disso — não tem estado próprio, só lê os props direto.

## Comments

Verificado via CDP contra dados reais no Postgres do Docker (script descartável simulando o resultado de outra pessoa/aba mexendo na Partida) — a tela de Partida em andamento mostrou a projeção de ranking (ticket 50) do Jogador que "saiu" corretamente sem F5 manual. Não isolei via Playwright o timing exato do intervalo de 5s (esperar 5s+ num teste automatizado só pra provar o polling não valia o tempo desta rodada); a lógica do hook (`setInterval` + `visibilitychange`) é direta o bastante pra confiar na leitura do código. `npm test` (58/58), `npm run test:integration` (91/91), lint e `tsc --noEmit` limpos.
