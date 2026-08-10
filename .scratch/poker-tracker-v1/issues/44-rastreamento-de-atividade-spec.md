# 44 — Rastreamento de atividade (quem fez o quê, quem editou por último)

**What to build:** Com múltiplos Organizadores (ticket 43), não tem mais como saber quem criou/editou uma Partida, um Lançamento, um lançamento de Caixa, etc. — só o estado atual, sem autoria. Pedido: planejar a melhor forma de rastrear isso.

**Blocked by:** 43 (múltiplos Organizadores — é o que torna isso necessário)

**Status:** done — escopo escolhido pelo Organizador: Fase 1 + Fase 2 completa

## O que já temos de graça

Toda rota que muda alguma coisa já passa por `requireOrganizadorOuResposta()`/`requireOrganizador()` — o "quem" já está disponível em **toda** mutação do app, só não é persistido em lugar nenhum hoje. Conferido: `partidas`, `lancamentos`, `caixa_transacoes` e `temporadas` não têm nenhuma coluna de autoria (`criado_por`/`atualizado_por`) nem, na maioria dos casos, nem `atualizado_em` — só `partidas.criado_em` existe.

Única rota mutável sem login: inscrição de notificação push (`/api/partidas/[id]/timer/notificacoes`) — pública de propósito (qualquer visitante liga notificação pro próprio celular), não precisa de autoria.

## Dois mecanismos complementares — recomendo os dois, em fases

### Fase 1 — Colunas "quem/quando" nos registros principais

Em `partidas`, `lancamentos`, `caixa_transacoes`, `temporadas`, `jogadores`:

- `criado_por_jogador_id` (FK `jogadores.id`, `ON DELETE SET NULL`, nullable)
- `atualizado_por_jogador_id` (idem)
- `atualizado_em` (`timestamptz`, atualizado em todo `UPDATE`)

Responde direto "quem criou isso" e "quem foi o último a mexer", sem precisar de tela nova — já dá pra mostrar inline (ex: "editado por Felipe há 5 min" numa linha de Lançamento).

**Custo:** migration pequena + cada função de escrita em `src/lib/*.ts` passa a receber o `organizadorId` (a rota já tem esse valor — `requireOrganizadorOuResposta()` retorna o Organizador logado — só falta repassar pra função da lib) e gravar nas colunas.

### Fase 2 — Log de atividade (histórico completo, não só o último toque)

Tabela nova `eventos_de_auditoria`:

```
id
jogador_id        -- quem fez (nullable: null = script/sistema, ex: import histórico)
acao               -- texto, ex: "partida.criada", "lancamento.atualizado", "jogador.promovido"
entidade_tipo       -- "partida" | "lancamento" | "jogador" | "temporada" | "caixa_transacao"
entidade_id
dados_antes         -- jsonb, opcional (snapshot antes da mudança)
dados_depois         -- jsonb, opcional (snapshot depois)
criado_em
```

Responde "o que aconteceu, em ordem, com quem" — útil pra reconstituir uma disputa ("quem mudou minha posição de 3 pra 5?") ou auditar ações sensíveis (promover/rebaixar Organizador, mexer no Caixa).

**Mecanismo:** uma função central `registrarEvento()`, chamada ao final de cada mutação (dentro da mesma transação, quando já existir uma) — evita espalhar `INSERT INTO eventos_de_auditoria` em cada função da lib.

**Eventos sensíveis a logar primeiro** (maior valor de auditoria): promover/rebaixar Organizador, editar Lançamento (posição/eliminador — é onde mais rola disputa), lançar Caixa saída manual, encerrar Temporada, editar Parâmetros da Temporada.

**Deixaria de fora do log** (ruído de alta frequência, baixo valor de auditoria): pausar/iniciar Timer, pular/voltar nível.

## O que não recomendo, por ora

- **IP/dispositivo por ação** — baixo valor pra um grupo pequeno e de confiança; mais um dado sensível pra guardar sem necessidade real demonstrada.
- **Log de login/logout separado** — dá pra inferir do próprio rastro de ações (se alguém fez algo, óbvio que logou); duplicaria informação sem ganho real.

## UI (opcional, fase 3 — só se fizer sentido depois de ver o uso real)

- Badge discreto "editado por X" nos Lançamentos/Partida — usa só as colunas da Fase 1, sem tela nova.
- Página "Atividade" (só Organizador), listando os eventos da Fase 2, filtrável por Partida/Temporada.

## Recomendação de escopo

Pro tamanho do grupo (poucos Organizadores, baixo volume de escrita por semana), a **Fase 1 sozinha já resolve o pedido concreto** ("quem criou/editou por último") com esforço bem menor que a Fase 2. A Fase 2 (log completo com histórico) só compensa se realmente quiser reconstituir a sequência completa de mudanças, não só o estado atual.

## Comments

Organizador escolheu **Fase 1 + Fase 2 completa**.

### Implementado

- [x] Migration `1786386220891_rastreamento-de-atividade`: `criado_por_jogador_id`/`atualizado_por_jogador_id`/`atualizado_em` em `jogadores`, `temporadas`, `partidas`, `lancamentos` (que ganhou `criado_em` também, não tinha nenhum timestamp) e `caixa_transacoes`; tabela nova `eventos_de_auditoria` com índices em `(entidade_tipo, entidade_id)` e `criado_em`
- [x] `src/lib/auditoria.ts` (novo): `registrarEvento()` (nunca lança — uma falha ao auditar não pode derrubar a ação de verdade) e `listarEventosDeAuditoria()` (pronta pra uma futura tela de Atividade, ver Fase 3 acima — não construída nesta rodada, não foi pedida)
- [x] `atorId` (o Organizador logado, `null` só em scripts/seed) passado por toda função de escrita da lib: `criarJogador`/`editarNomeDoJogador`/`definirAtivoDoJogador`/`definirOrganizadorDoJogador` (`jogadores.ts`), `criarTemporada`/`editarParametrosDaTemporada`/`encerrarTemporada` (`temporadas.ts`), `criarPartida`/`editarDataDaPartida`/`adicionarParticipante`/`atualizarLancamento`/`marcarSaida`/`finalizarPartida` (`partidas.ts`), `lancarSaidaManual` (`caixa.ts`) — e toda rota de API que os chama, repassando o Organizador que `requireOrganizadorOuResposta()` já retorna
- [x] Log de verdade (Fase 2) gravado exatamente nos eventos "sensíveis" listados acima, mais nada — confirmado via `AcaoDeAuditoria`: `jogador.promovido`, `jogador.rebaixado`, `lancamento.atualizado` (cobre tanto `atualizarLancamento` quanto `marcarSaida` — mesma entidade, mesma ação), `caixa.saida_manual_lancada`, `temporada.encerrada`, `temporada.parametros_atualizados`. Timer, criar/ativar Jogador, criar Partida, adicionar participante, finalizar Partida: só colunas da Fase 1, sem entrada no log, como planejado
- [x] Verificado ponta a ponta via chamadas HTTP reais (não só os testes): criar Partida → `criado_por_jogador_id` certo em `partidas` e em cada `lancamentos`; editar Pagamento → `atualizado_por_jogador_id`/`atualizado_em` gravados **e** evento `lancamento.atualizado` com `dados_antes`/`dados_depois` batendo; promover/rebaixar Organizador → dois eventos, com telefone só no "depois" da promoção; lançar saída manual → evento com valor/descrição; editar Parâmetros da Temporada → evento com os Parâmetros completos antes/depois
- [x] `npm test` (50/50), `npm run test:integration` (83/83 — todas as ~100 chamadas de teste às funções da lib atualizadas pra passar o novo `atorId`, a maioria via um script Python de substituição consciente de parênteses, não à mão), lint e `tsc --noEmit` limpos

**Fora de escopo aqui (Fase 3, como já estava marcado como opcional na proposta):** nenhuma tela nova — nem badge "editado por X" nem página de Atividade. Os dados já estão sendo gravados e `listarEventosDeAuditoria()` já existe pronta pra alimentar isso quando/se fizer sentido.
