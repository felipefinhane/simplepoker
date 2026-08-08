# 32 — Parâmetros da Temporada do seed local iguais aos de produção

**What to build:** O `seed-dev.ts` (ticket 31) criava a Temporada aberta com `obterParametrosPadraoParaNovaTemporada()` — Tabela de Pontos e multiplicadores já batiam por coincidência com os valores reais de produção (é o mesmo fallback "primeira Temporada", vindo de `POKER 1_2026.xlsx`), mas Estrutura de Blinds e Fichas Iniciais ficavam vazias nesse fallback (nunca tiveram valor confirmado até então). Pedido do Organizador: fazer os Parâmetros locais baterem com produção de verdade, pra testar Timer/Fichas igual.

**Blocked by:** 31

**Status:** done

- [x] Conferido os Parâmetros reais da Temporada aberta em produção (a mesma que já está sendo usada de verdade, id 1) — Tabela de Pontos e multiplicadores já batiam com o padrão; Estrutura de Blinds (13 níveis) e Fichas Iniciais (5 tipos) tinham valores reais nunca refletidos no fallback do código
- [x] `scripts/seed-dev.ts` trocou o fallback genérico por `PARAMETROS_IGUAIS_A_PRODUCAO`, hardcoded com os valores reais — Tabela de Pontos, Valor da Partida, multiplicadores, Estrutura de Blinds e Fichas Iniciais idênticos aos de produção
- [x] Temporada local já em uso nesta sessão também atualizada na hora (`PATCH /api/temporadas/1`, mesma rota que a UI usa) — não precisou de `down -v`
- [x] Verificado do zero (`docker compose down -v` + `up`): seed roda, Temporada criada já com os 13 níveis de blind e as 5 fichas reais, conferido via `GET /api/temporadas`; `tsc --noEmit` e lint limpos

**Nota:** `obterParametrosPadraoParaNovaTemporada()` (usado pela UI de "Nova Temporada" em produção) continua com o fallback antigo — mudar isso é uma decisão de produto separada (mexeria no formulário real que o Organizador usa pra abrir a próxima Temporada), fora do escopo daqui, que era só o seed de dev.
