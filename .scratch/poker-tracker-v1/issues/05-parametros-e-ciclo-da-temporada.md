# 05 — Parâmetros e ciclo da Temporada

**What to build:** Organizador autenticado cria uma nova Temporada definindo seus Parâmetros (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida, Estrutura de Blinds, Fichas Iniciais) — pré-preenchidos com os valores da planilha atual na primeira Temporada, ou com os valores da Temporada anterior nas seguintes. Só uma Temporada pode estar aberta por vez: para abrir uma nova é preciso encerrar a atual, o que congela seu estado para consulta histórica.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Organizador cria uma nova Temporada com todos os Parâmetros exigidos — `POST /api/temporadas`, página `/temporadas`
- [x] Ao criar, os campos vêm pré-preenchidos (planilha atual na primeira vez; Temporada anterior depois) mas são editáveis — `obterParametrosPadraoParaNovaTemporada()`; Estrutura de Blinds e Fichas Iniciais começam vazias (nunca tivemos valores reais confirmados pra elas — só Tabela de Pontos, Valor da Partida e multiplicadores vêm da planilha)
- [x] Organizador edita os Parâmetros de uma Temporada enquanto ela está aberta — `PATCH /api/temporadas/[id]`
- [x] Não é possível ter duas Temporadas abertas ao mesmo tempo — checado na aplicação (`JaExisteTemporadaAbertaError`) **e** garantido de verdade pelo índice único parcial no banco, não só declarado como "defesa em profundidade": há um teste de integração que dispara duas criações concorrentes de propósito (sem `await` entre elas) e confirma que a segunda recebe o erro de domínio certo, não um erro genérico do Postgres vazando como 500 — isso só passou depois de uma correção pega pela revisão (ver abaixo)
- [x] Organizador encerra a Temporada aberta; a partir daí seus Parâmetros ficam congelados (somente leitura) — `POST /api/temporadas/[id]/encerrar`; edição depois disso é recusada (`TemporadaEncerradaError`). *Ajuste ao texto original do ticket*: "e dados" foi removido daqui — Partida ainda não existe (chega no ticket 06), então não há dado nenhum além dos Parâmetros pra congelar ainda.
- [x] Ação bloqueada para quem não está autenticado como Organizador — `requireOrganizadorOuResposta` em todas as rotas; página redireciona pra `/login`

**Decisão de design**: o tipo `ParametrosDaTemporada` (ticket 02) foi completado aqui com Tabela de Pontos, Estrutura de Blinds e Fichas Iniciais — exatamente como o comentário do ticket 02 previa. As funções de Caixa/Premiação (ticket 02) passaram a receber só o subconjunto que usam (`ParametrosDePremiacao`), pra não exigir Estrutura de Blinds/Fichas de quem só calcula dinheiro.

**Bug real corrigido na revisão (`/code-review`)**: `criarTemporada` fazia a checagem "já existe aberta?" e o `INSERT` como dois passos separados — duas requisições concorrentes podiam passar pela checagem ao mesmo tempo. O índice único do banco impediria a segunda linha de existir, mas o erro cru do Postgres (`23505`) não virava uma resposta 409 decente, estourava como 500. Agora `criarTemporada` converte essa violação em `JaExisteTemporadaAbertaError`, com teste de integração provando o cenário de corrida de verdade.
