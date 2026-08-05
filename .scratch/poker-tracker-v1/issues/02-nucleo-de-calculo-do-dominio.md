# 02 — Núcleo de cálculo do domínio

**What to build:** Uma camada de funções puras — sem banco, sem HTTP, sem UI — que, a partir de Posição, Almas, quantidade de participantes e dos Parâmetros da Temporada (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida), calcula: Pontos de um Jogador numa Partida, Ranking de Pontuação, Ranking Carrasco, Premiação da Partida, e a entrada automática correspondente no Caixa. Ver `CONTEXT.md` para a definição de cada termo.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Pontos de uma Partida = pontos da Posição (via Tabela de Pontos) + 1 × Almas
- [ ] Ranking de Pontuação ordena Jogadores pela soma de Pontos na Temporada, com critério de desempate definido
- [ ] Ranking Carrasco ordena Jogadores pela soma de Almas na Temporada, com critério de desempate definido
- [ ] Premiação da Partida calcula o valor pago ao 1º e 2º colocados como múltiplos do Valor da Partida
- [ ] Entrada automática no Caixa = (quantidade de participantes × Valor da Partida) − Premiação da Partida
- [ ] Testes de regressão usando os resultados reais já apurados em `POKER 1_2026.xlsx` como fixture, confirmando que os cálculos batem com o que a planilha já apurou manualmente
