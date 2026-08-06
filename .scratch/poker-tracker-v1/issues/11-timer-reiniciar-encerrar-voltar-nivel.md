# 11 — Timer: reiniciar, encerrar e voltar nível

**What to build:** Três novos controles pro Timer de blinds, pedidos pelo Organizador: "reiniciar" (volta pro primeiro nível com o tempo cheio, mas continua controlável), "encerrar" (zera e **trava** — nenhum controle funciona mais depois, sem volta) e "voltar nível" (oposto de "pular nível", pra corrigir quando avançou o nível errado por engano).

**Blocked by:** 09 (Timer de blinds sincronizado)

**Status:** ready-for-agent

- [x] Migração: `timers_de_partida.encerrado` (boolean, default false)
- [x] `reiniciarTimer` — volta pro nível 0, parado, tempo cheio do nível; funciona mesmo se o Timer nunca tiver sido iniciado (UPSERT); recusa se não há Estrutura de Blinds configurada; recusa se o Timer já foi encerrado
- [x] `voltarNivel` — oposto de `pularNivel`: decrementa o nível, zera o tempo decorrido, mantém rodando/pausado como estava; recusa antes do primeiro nível (`PrimeiroNivelError`); recusa se o Timer nunca foi iniciado (`TimerNaoIniciadoError`, igual a `pularNivel`)
- [x] `encerrarTimer` — zera (nível 0, parado, tempo cheio) e marca `encerrado = true`; idempotente (chamar de novo não dá erro); funciona mesmo se o Timer nunca tiver sido iniciado
- [x] Uma vez encerrado, `iniciarTimer`/`pausarTimer`/`pularNivel`/`voltarNivel`/`reiniciarTimer` recusam com `TimerEncerradoError` — não existe "reabrir"
- [x] Todos os seis (os cinco de sempre + `encerrarTimer`) continuam recusando numa Temporada encerrada (`TemporadaEncerradaError`, mesma trava `FOR UPDATE` já usada nos outros controles)
- [x] `EstadoDoTimer` expõe `encerrado`, consumido tanto pela rota pública (`GET`, sem login) quanto pelas de controle
- [x] UI (`timer-client.tsx`): botões "Voltar nível" (ao lado de "Pular nível", desabilitado no nível 0), "Reiniciar" e "Encerrar" (ambos com confirmação, mesmo padrão do "Finalizar Partida"); quando `encerrado`, esconde todos os controles e mostra "Timer encerrado."
- [x] Ações continuam exigindo Organizador autenticado (`requireOrganizadorOuResposta` nas 3 rotas novas)

**Decisões de design**:
- `pularNivel` e `voltarNivel` compartilham a mesma implementação (`mudarNivel`, parametrizada por delta +1/-1 e pelo erro de limite) — evita duplicar a leitura/trava/validação/gravação entre os dois.
- "Reiniciar" e "encerrar" fazem UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) em vez de exigir uma linha já existente em `timers_de_partida` — diferente de "pular"/"voltar nível" (que não fazem sentido antes de existir um Timer rodando), reiniciar/encerrar são ações "zera daqui pra frente" que fazem sentido mesmo num Timer que nunca foi iniciado.
- `encerrarTimer` chamado de novo depois de já encerrado não é um erro — é idempotente (continua encerrado). Diferente disso, todos os outros controles (`iniciar`/`pausar`/`pular`/`voltar`/`reiniciar`) recusam com `TimerEncerradoError` uma vez que `encerrado = true`.
- Nenhuma forma de "reabrir" um Timer encerrado — mesma semântica definitiva de `finalizarPartida`/`encerrarTemporada` (ver CONTEXT.md — Timer).

**Achados do `/code-review` e correções aplicadas antes de commitar**:
- `travarTemporada` (só a trava da Temporada) extraída como a única fonte da checagem "Temporada aberta" — antes, `mudarNivel` e `encerrarTimer` reimplementavam esse `SELECT ... FOR UPDATE` inline em vez de reusar o helper já existente (`travarTemporadaEControleDoTimer`, que agora chama `travarTemporada` por baixo).
- `zerarLinhaDoTimer` extraída e compartilhada entre `reiniciarTimer` e `encerrarTimer` — os dois faziam o mesmíssimo UPSERT, diferindo só no valor de `encerrado`.
- Faltavam testes de `voltarNivel`/`reiniciarTimer`/`encerrarTimer` contra uma Temporada já encerrada — adicionados (e corrigido o texto deste ticket, que dizia "os cinco" quando na verdade são seis controles).
- Adicionado teste explícito confirmando que `encerrarTimer` funciona mesmo sem Estrutura de Blinds configurada — documenta a assimetria com os outros controles (todos exigem Estrutura de Blinds; encerrar não, porque travar é válido mesmo num Timer que nunca pôde ser usado de fato).
