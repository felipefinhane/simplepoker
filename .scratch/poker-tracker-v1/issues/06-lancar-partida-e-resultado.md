# 06 — Lançar Partida e resultado

**What to build:** Organizador autenticado cria uma Partida vinculada à Temporada aberta, selecionando os Jogadores participantes (rejeitando menos de 5), e lança para cada um sua Posição final, número de Almas e Pagamento. O sistema usa o núcleo de cálculo (ticket 02) e os Parâmetros da Temporada (ticket 05) para calcular e exibir os Pontos de cada Jogador, a Premiação da Partida, e gera automaticamente a entrada correspondente no Caixa da Temporada. Um resultado já lançado pode ser editado para corrigir erros.

**Blocked by:** 02, 04, 05

**Status:** ready-for-agent

- [ ] Organizador cria uma Partida (data + Jogadores participantes) vinculada à Temporada aberta
- [ ] Criação rejeitada se houver menos de 5 participantes
- [ ] Organizador lança Posição, Almas e Pagamento por Jogador participante
- [ ] Pontos de cada Jogador na Partida são calculados e exibidos automaticamente (via ticket 02)
- [ ] Premiação da Partida (1º e 2º colocados) é calculada e exibida automaticamente
- [ ] Entrada automática no Caixa da Temporada é gerada ao salvar o resultado da Partida
- [ ] Organizador edita um resultado já lançado, e os cálculos derivados (Pontos, Premiação, entrada do Caixa) são recalculados
- [ ] Ação bloqueada para quem não está autenticado como Organizador
