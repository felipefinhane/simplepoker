# 05 — Parâmetros e ciclo da Temporada

**What to build:** Organizador autenticado cria uma nova Temporada definindo seus Parâmetros (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida, Estrutura de Blinds, Fichas Iniciais) — pré-preenchidos com os valores da planilha atual na primeira Temporada, ou com os valores da Temporada anterior nas seguintes. Só uma Temporada pode estar aberta por vez: para abrir uma nova é preciso encerrar a atual, o que congela seu estado para consulta histórica.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Organizador cria uma nova Temporada com todos os Parâmetros exigidos
- [ ] Ao criar, os campos vêm pré-preenchidos (planilha atual na primeira vez; Temporada anterior depois) mas são editáveis
- [ ] Organizador edita os Parâmetros de uma Temporada enquanto ela está aberta
- [ ] Não é possível ter duas Temporadas abertas ao mesmo tempo
- [ ] Organizador encerra a Temporada aberta; a partir daí seus Parâmetros e dados ficam congelados (somente leitura)
- [ ] Ação bloqueada para quem não está autenticado como Organizador
