# 34 — Banner "Partida em andamento" na Home

**What to build:** Organizador relatou que, ao instalar o PWA no iPhone sem fazer login, o Timer "não apareceu" e pediu pra Home indicar quando há uma Partida em andamento.

**Blocked by:** 14 (Timer), 09 (PWA)

**Status:** done

- [x] Investigado primeiro: reproduzi via CDP com cookies limpos contra uma Partida em andamento local — o Timer em si renderiza normalmente pra visitante anônimo em `/partidas/[id]` (a rota já é pública desde o ticket 14). Não havia bug no Timer — o problema real era descoberta: nada na Home sinalizava que existia uma Partida acontecendo agora, então quem abria o app direto na Home nunca chegava até a página da Partida pra ver o Timer
- [x] `src/app/page.tsx`: além de `partidas` (só finalizadas, usadas no "Últimas Partidas"), agora também busca `partidaEmAndamento` (a não-finalizada, se existir) e mostra um banner clicável no topo da Home — ícone de timer pulsando, data + nº de Jogadores, link direto pra `/partidas/[id]`
- [x] Banner usa o mesmo `secondary` (dourado) já usado nos indicadores de urgência/ação do design system, com hover e seta indicando que é clicável
- [x] Verificado via CDP (`cdp-anon-screenshot.mjs`, sessão anônima): banner aparece corretamente na Home, sem cookie de login; texto sem corte (removido `truncate` que cortava o subtítulo numa primeira versão)
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
