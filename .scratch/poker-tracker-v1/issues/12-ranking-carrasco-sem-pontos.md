# 12 — Ranking Carrasco sem coluna de Pontos

**What to build:** O Ranking Carrasco (quem mais eliminou gente) não precisa mostrar a coluna de Pontos — é um ranking à parte do de Pontuação, e mostrar Pontos ali só distrai de responder "quem mais eliminou gente".

**Blocked by:** 07 (ranking público)

**Status:** ready-for-agent

- [x] `RankingsDaTemporada`/`TabelaDeRanking` (`src/components/rankings-da-temporada.tsx`): a tabela do Ranking Carrasco mostra só `#`, `Jogador` e `Almas` — sem a coluna `Pontos`
- [x] O Ranking de Pontuação continua mostrando as duas colunas (Pontos em destaque, Almas como contexto/desempate) — não mudou
- [x] Verificado visualmente (HTML renderizado localmente): cabeçalho do Ranking Carrasco tem só `#` / `Jogador` / `Almas`

**Decisões de design**:
- `TabelaDeRanking` já recebia uma prop `destaque` (`"totalPontos" | "totalAlmas"`) pra decidir qual coluna fica em negrito — reaproveitada pra também decidir se a coluna de Pontos aparece (`mostrarPontos = destaque === "totalPontos"`), em vez de criar uma prop nova só pra isso.
- Sem teste automatizado — este componente é só apresentação (JSX puro, sem lógica de domínio) e o projeto não tem infraestrutura de teste de componente React (nenhum `.test.tsx` existe); verificado manualmente renderizando a home localmente contra dados reais de uma Partida finalizada.
