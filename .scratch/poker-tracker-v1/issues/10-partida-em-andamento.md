# 10 — Partida em andamento (editar, adicionar participantes, eliminações em cadeia, finalizar)

**What to build:** Correção pós-v1 pedida pelo Organizador: a Partida deixa de ser "cria e lança tudo de uma vez" (modelo atômico do ticket 06) e passa a ter um ciclo de vida "em andamento" → "finalizada". Enquanto em andamento, dá pra editar data, adicionar participantes (inclusive cadastrando um Jogador novo na hora) e registrar quem saiu conforme o jogo avança — cada participante marcado como eliminado tem seu Eliminador registrado, e a Alma passa a ser derivada dessa relação (não mais um número digitado). "Finalizar Partida" fecha o campeão automaticamente, calcula Premiação/Caixa e trava a Partida.

**Blocked by:** 06 (substitui o fluxo atômico de `lancarResultado` que esse ticket criou)

**Status:** ready-for-agent

- [x] Migração: `partidas.finalizada` (Partidas antigas totalmente lançadas foram marcadas como já finalizadas); `lancamentos.eliminado_por_jogador_id` substitui `lancamentos.almas` (removida — Almas agora é sempre derivado)
- [x] Editar data de uma Partida em andamento — `PATCH /api/partidas/[id]`
- [x] Adicionar participante (Jogador ativo existente) a uma Partida em andamento — `POST /api/partidas/[id]/participantes`
- [x] Cadastrar um Jogador novo direto na tela da Partida (reusa `POST /api/jogadores` + adicionar como participante)
- [x] Marcar "saiu" com seletor de quem eliminou (só entre os ainda ativos) — `POST /api/partidas/[id]/lancamentos/[jogadorId]/sair`, atribui a posição automaticamente contando os ainda ativos
- [x] Editar Posição/Eliminador/Pagamento de qualquer participante a qualquer momento (fluxo "lançar tudo no final") — `PATCH /api/partidas/[id]/lancamentos/[jogadorId]`
- [x] "Finalizar Partida" — `POST /api/partidas/[id]/finalizar`: se sobrar exatamente 1 sem posição, vira 1º automaticamente; calcula Premiação da Partida e a entrada no Caixa; trava a Partida (`finalizada = true`)
- [x] Depois de finalizada, todas as ações de edição acima são recusadas (`PartidaFinalizadaError`)
- [x] Ranking de Pontuação/Carrasco só consideram Partidas finalizadas (não mais só "posição preenchida", já que agora isso pode ser parcial durante o jogo)
- [x] Ação bloqueada para quem não está autenticado como Organizador — `requireOrganizadorOuResposta` em todas as rotas novas

**Mecânica da Alma, confirmada com o Organizador** (ver CONTEXT.md — Eliminou, Alma):
- Cada Jogador começa com 1 alma própria. Ao ser eliminado, entrega só essa alma própria pro Eliminador — o que ele já tinha coletado de outros fica com ele mesmo.
- 1º e 2º colocado nunca são eliminados (a Partida termina com os dois de pé) — guardam a própria alma também.
- Fórmula sem precisar reconstruir cadeia: **Almas = quantos Jogadores ele eliminou nessa Partida + 1 se terminou em 1º ou 2º**.
- Verificado com um cenário real de 5 jogadores (ver teste `finalizarPartida > cenário completo`): a soma de Almas de todos os participantes sempre bate com o total de participantes.

**Decisões de design**:
- "Finalizar" só auto-atribui a posição 1 quando resta **exatamente 1** sem posição — como o 1º e o 2º nunca são eliminados (não têm um evento de "saiu"), o Organizador decide manualmente quem ficou em 2º (editando o campo de posição direto, sempre disponível) antes de finalizar; o último que sobra vira 1º sozinho.
- `atualizarLancamento` (edição manual) e `marcarSaida` (fluxo "saiu agora") compartilham a mesma validação de Eliminador, exceto por uma diferença: `marcarSaida` exige que o Eliminador esteja **ainda ativo** no momento (faz sentido pro fluxo ao vivo); `atualizarLancamento` aceita qualquer participante da Partida como Eliminador (o fluxo "lançar tudo no final" já tem todo mundo com posição, então "ainda ativo" não faria sentido).
- Migração de dados reais: a única Partida já finalizada em produção sob o modelo antigo (Felipe 1º, Danilo 2º, Sergio 3º, Alexandre 4º, Carlão 5º, Nino 6º) teve seu Eliminador reconstruído manualmente com dados reais fornecidos pelo Organizador (Felipe eliminou Sergio e Carlão; Danilo eliminou Nino e Alexandre) — os totais de Almas batem exatamente com os valores que já estavam salvos (3 e 3).
- Migração de schema idempotente/genérica: marca como `finalizada` toda Partida que já tinha 100% dos Lançamentos com posição preenchida, independente de qual ambiente/dado — a reconstrução do Eliminador da Partida real de produção foi um script à parte, não faz parte da migração.

**Achados do `/code-review` (Standards + Spec) e correções aplicadas antes de commitar**:
- Fórmula de Almas centralizada em `calcularAlmas` (novo, `src/domain/alma.ts`, com testes unitários) — antes estava duplicada como um ternário em `buscarPartidaPorId` e um `CASE` em SQL em `calcularRankingsDaTemporada`, cada um com sua própria conversão de `COUNT(*)` (um tinha esquecido o cast `::integer`, causando drift entre os dois).
- `marcarSaida`, `atualizarLancamento`, `adicionarParticipante`, `editarDataDaPartida` e `finalizarPartida` agora travam a Partida (e a Temporada) com `SELECT ... FOR UPDATE` dentro de uma transação antes de ler/gravar — mesmo padrão já usado em `encerrarTemporada`/`lancarSaidaManual`/`timer.ts`. Sem isso, duas chamadas concorrentes de `marcarSaida` na mesma Partida podiam calcular a mesma "posição livre" e gravar a mesma posição pra duas pessoas.
- A posição atribuída por `marcarSaida` passou a ser "a maior posição de 1..N ainda não usada" em vez de "quantos ainda estão sem posição" — as duas contas dão o mesmo resultado enquanto só `marcarSaida` preenche posições, mas divergem se o Organizador já tiver lançado uma posição manualmente fora de ordem via `atualizarLancamento` (fluxo "lançar tudo no final" convivendo com o incremental); a conta antiga colidia nesse caso.
- `LancamentosInvalidosError` renomeada pra `DadosDaPartidaInvalidosError` — o nome antigo não cobria o caso de data inválida da Partida (`editarDataDaPartida`), só o de Lançamento.
- Tipo `AtualizacaoDeLancamento` extraído e exportado de `src/lib/partidas.ts`, reaproveitado pela rota `PATCH` e pelo client component (eliminou uma repetição do mesmo shape de objeto em 3 lugares).
