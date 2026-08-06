# 06 — Lançar Partida e resultado

**What to build:** Organizador autenticado cria uma Partida vinculada à Temporada aberta, selecionando os Jogadores participantes (rejeitando menos de 5), e lança para cada um sua Posição final, número de Almas e Pagamento. O sistema usa o núcleo de cálculo (ticket 02) e os Parâmetros da Temporada (ticket 05) para calcular e exibir os Pontos de cada Jogador, a Premiação da Partida, e gera automaticamente a entrada correspondente no Caixa da Temporada. Um resultado já lançado pode ser editado para corrigir erros.

**Blocked by:** 02, 04, 05

**Status:** ready-for-agent

- [x] Organizador cria uma Partida (data + Jogadores participantes) vinculada à Temporada aberta — `POST /api/partidas`, página `/partidas/nova`
- [x] Criação rejeitada se houver menos de 5 participantes — `MinimoDeParticipantesError`; também rejeita sem Temporada aberta e com Jogador inexistente/desativado
- [x] Organizador lança Posição, Almas e Pagamento por Jogador participante — `PUT /api/partidas/[id]/lancamentos`, todos os participantes de uma vez (não é possível lançar parcial — decisão de design abaixo)
- [x] Pontos de cada Jogador na Partida são calculados e exibidos automaticamente (via ticket 02) — derivado sempre, nunca armazenado (`calcularPontosDoLancamento`)
- [x] Premiação da Partida (1º e 2º colocados) é calculada e exibida automaticamente — `calcularPremiacaoDaPartida`, exibida na resposta de lançar resultado
- [x] Entrada automática no Caixa da Temporada é gerada ao salvar o resultado da Partida — grava em `caixa_transacoes` (tipo `entrada_partida`), dentro de uma transação junto com os Lançamentos
- [x] Organizador edita um resultado já lançado, e os cálculos derivados (Pontos, Premiação, entrada do Caixa) são recalculados — reenviar `PUT` substitui a entrada no Caixa em vez de duplicar (índice único parcial + `ON CONFLICT`); bloqueado se a Temporada da Partida já estiver encerrada
- [x] Ação bloqueada para quem não está autenticado como Organizador — `requireOrganizadorOuResposta` em todas as rotas; páginas redirecionam pra `/login`

**Decisões de design**:
- Lançar resultado é **atômico e completo** — um único `PUT` com todos os participantes de uma vez, não linha a linha. Evita calcular Premiação/Caixa sobre um resultado parcial (ex: só 3 de 5 posições preenchidas). A Partida é criada com um "Lançamento vazio" (posição `null`) por participante, que essa chamada preenche.
- Diferente de Pontos/Ranking/Premiação (sempre recalculados a partir dos Parâmetros **atuais** da Temporada — decisão do ticket 02), a entrada no Caixa é gravada como valor fixo no momento do lançamento — é um registro contábil real, não uma exibição derivada. Reeditar um resultado recalcula e **substitui** essa entrada (não soma nem duplica).
- Um resultado só pode ser lançado/editado enquanto a Temporada da Partida estiver aberta — estende o "congelado após encerrar" do ticket 05 para o primeiro dado real que existe pra congelar.
- Testes de integração exigiram rodar os arquivos sequencialmente (`fileParallelism: false` no `vitest.integration.config.mts`) — `temporadas` tem uma regra global ("só uma aberta") que não é isolada por teste, e arquivos em paralelo competindo pela mesma tabela causavam flakiness real (não um bug de produto).

**Correções aplicadas na revisão (`/code-review`)**:
- **Vocabulário**: o código usava "Resultado" (tabela `resultados_de_partida`, tipos, rota `/resultados`) para o conceito que o `CONTEXT.md` já nomeia como **Lançamento**. Renomeado por completo: tabela `lancamentos`, tipo `LancamentoDaPartida`, rota `/api/partidas/[id]/lancamentos`, erros `LancamentosInvalidosError`. "Resultado"/"lançar resultado" continuam como linguagem comum pra descrever a ação (igual `docs/agents/domain.md` distingue a ação "lançar classificação" do substantivo Lançamento), não como nome de tipo/tabela.
- **Corrida real corrigida**: `lancarResultado` conferia `temporada.aberta` *antes* da transação — a mesma classe de corrida do ticket 05 (checar-depois-agir), só que sem a trava. Duas chamadas concorrentes (lançar resultado + encerrar a Temporada) podiam intercalar e gravar um lançamento numa Temporada já encerrada. Corrigido com `SELECT ... FOR UPDATE` na linha da Temporada dentro da transação, travando contra `encerrarTemporada` concorrente; a checagem duplicada `TemporadaDaPartidaEncerradaError` foi removida em favor de reusar `TemporadaEncerradaError` (mesma regra, um lugar só). Teste de integração dispara a corrida de propósito (sem `await` entre as duas chamadas) e confirma que o resultado final é sempre consistente, não importa quem "ganha".
- **Bug menor corrigido**: `jogadorIds` duplicados na criação de uma Partida agora são deduplicados antes de validar o mínimo e gravar, em vez de estourar como erro cru de violação de unicidade do Postgres.
- `listarPartidas` faz uma consulta por Partida (N+1) em vez de uma única consulta agregada — aceito como simplificação deliberada dado o volume de uso (um grupo de amigos, poucas dezenas de Partidas por Temporada); comentário no código registra a decisão.
