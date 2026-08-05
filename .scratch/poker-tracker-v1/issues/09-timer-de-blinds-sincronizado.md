# 09 — Timer de blinds sincronizado

**What to build:** Organizador autenticado controla start/pause/pular nível do timer de blinds de uma Partida, seguindo a Estrutura de Blinds definida nos Parâmetros da sua Temporada. Qualquer pessoa com o app aberto (logada ou não) acompanha o mesmo timer contando ao vivo, via polling, e recebe um alerta visual/sonoro quando o nível muda. Notificação push com o app fechado fica fora desta versão (v2) — ver `docs/adr/0001-timer-sincronizado-via-servidor.md`.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [ ] Estado do timer (nível atual, instante de início do nível, rodando/pausado) é mantido no servidor, associado à Partida
- [ ] Organizador inicia, pausa e pula nível do timer
- [ ] Qualquer cliente com o app aberto reflete o mesmo estado do timer, atualizado por polling
- [ ] Alerta visual/sonoro é disparado localmente em cada cliente aberto quando o nível muda
- [ ] Controle do timer bloqueado para quem não está autenticado como Organizador
