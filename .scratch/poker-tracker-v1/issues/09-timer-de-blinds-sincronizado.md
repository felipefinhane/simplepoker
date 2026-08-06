# 09 — Timer de blinds sincronizado

**What to build:** Organizador autenticado controla start/pause/pular nível do timer de blinds de uma Partida, seguindo a Estrutura de Blinds definida nos Parâmetros da sua Temporada. Qualquer pessoa com o app aberto (logada ou não) acompanha o mesmo timer contando ao vivo, via polling, e recebe um alerta visual/sonoro quando o nível muda. Notificação push com o app fechado fica fora desta versão (v2) — ver `docs/adr/0001-timer-sincronizado-via-servidor.md`.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [x] Estado do timer (nível atual, instante de início do nível, rodando/pausado) é mantido no servidor, associado à Partida — tabela `timers_de_partida`, 1:1 com Partida
- [x] Organizador inicia, pausa e pula nível do timer — `POST /api/partidas/[id]/timer/{iniciar,pausar,pular-nivel}`; iniciar de novo enquanto já roda não reinicia a contagem (idempotente); pular no último nível é recusado
- [x] Qualquer cliente com o app aberto reflete o mesmo estado do timer, atualizado por polling — `GET /api/partidas/[id]/timer` (público), consultado a cada 3s pelo `TimerClient`, com contagem local entre polls pra não "pular" de 3 em 3 segundos
- [x] Alerta visual/sonoro é disparado localmente em cada cliente aberto quando o nível muda — beep via Web Audio API + destaque visual (borda laranja + aviso "⚠️ Nível mudou!" por alguns segundos) quando o `nivel` retornado pelo polling muda
- [x] Controle do timer bloqueado para quem não está autenticado como Organizador — `requireOrganizadorOuResposta` nas três rotas de controle; `GET` continua público

**Decisões de design**:
- O tempo decorrido é calculado no próprio SQL (`EXTRACT(EPOCH FROM (now() - inicio_do_nivel))`), não lido e recalculado em JS — evita uma corrida entre ler o estado e gravar de volta ao pausar.
- Controlar o timer (iniciar/pausar/pular) exige a Temporada aberta, com a mesma trava `SELECT ... FOR UPDATE` usada em `lancarResultado` (ticket 06) e `lancarSaidaManual` (ticket 08) — aplicada aqui desde o início, sem esperar a revisão encontrar de novo a mesma corrida pela quarta vez.
- Sem Estrutura de Blinds configurada na Temporada, o timer não pode ser iniciado (`SemEstruturaDeBlindsError`) — ela pode estar vazia por padrão (ticket 05: nunca tivemos valores reais confirmados pra ela).

**Correções aplicadas na revisão (`/code-review`)**:
- **Faltava o alerta visual** — só o sonoro tinha sido implementado antes ("visual/sonoro" no ticket original). Adicionado destaque de borda + aviso textual temporário.
- **Sem teste de corrida pro próprio timer**, ao contrário do que a afirmação de design sugeria — adicionado teste que dispara `pausarTimer` e `encerrarTemporada` concorrentes de propósito (sem `await` entre as duas), rodado 3x seguidas sem falha.
- **`pularNivel` num timer nunca iniciado** criava silenciosamente um estado pausado pulando o nível 0 sem nunca ter rodado — agora recusa com `TimerNaoIniciadoError`, exigindo iniciar primeiro.
- **Erro errado**: `pularNivel` sem Estrutura de Blinds configurada estourava `UltimoNivelError` (comparação `1 >= 0` trivialmente verdadeira) em vez de `SemEstruturaDeBlindsError` — checagem reordenada.
- `timer-client.tsx` importa `EstadoDoTimer` de `src/lib/timer.ts` via `import type` em vez de duplicar a interface (tipo é apagado em tempo de compilação, sem custo nenhum em runtime nem risco de puxar código de servidor pro bundle do cliente).
