# 08 — Extrato do Caixa

**What to build:** Qualquer visitante, sem login, vê o extrato do Caixa da Temporada atual (entradas automáticas por Partida e saídas manuais) e o saldo corrente. Organizador autenticado lança uma saída manual (data, descrição, valor — ex: compra de baralho, prêmio de fim de Temporada, confraternização).

**Blocked by:** 06

**Status:** ready-for-agent

- [x] Extrato do Caixa da Temporada atual visível sem login, mostrando cada entrada automática (vinculada à Partida de origem) e cada saída manual — página `/caixa`
- [x] Saldo atual do Caixa calculado e exibido — `calcularSaldoDaTemporada` (soma de entradas − soma de saídas), verificado com entrada+saída juntas
- [x] Organizador lança uma saída manual com data, descrição e valor — `POST /api/temporadas/[id]/caixa`, formulário só aparece pra quem está logado
- [x] Ação de lançar saída bloqueada para quem não está autenticado como Organizador — `requireOrganizadorOuResposta`

**Decisão de design**: uma saída manual só pode ser lançada enquanto a Temporada estiver aberta (reusa `TemporadaEncerradaError`), mesma trava já aplicada a Parâmetros (ticket 05) e Lançamentos (ticket 06) — consistente com o conceito de "congelado após encerrar".

**Correções aplicadas na revisão (`/code-review`)**:
- **Corrida real, a mesma classe já corrigida duas vezes**: a primeira versão de `lancarSaidaManual` checava `temporada.aberta` e gravava em passos separados, sem transação nem trava — a afirmação acima ("mesma trava já aplicada... ticket 06") não era verdade no código. Corrigido com `withTransaction` + `SELECT ... FOR UPDATE` na linha da Temporada, igual ao `lancarResultado`. Teste de integração novo dispara a corrida de propósito (lançar saída x encerrar, concorrentes, sem `await` entre as duas) e confirma consistência — rodado 5x seguidas sem falha.
- `ORDER BY data` no extrato podia amarrar no alias formatado (texto) em vez da coluna `timestamptz` de origem — qualificado explicitamente (`caixa_transacoes.data`).
- `ValorInvalidoError` cobria 3 campos diferentes (descrição, valor, data) com um nome que só sugeria "valor" — renomeado para `DadosDaSaidaInvalidosError`.
