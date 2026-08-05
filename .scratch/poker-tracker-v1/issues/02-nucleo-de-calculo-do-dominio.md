# 02 — Núcleo de cálculo do domínio

**What to build:** Uma camada de funções puras — sem banco, sem HTTP, sem UI — que, a partir de Posição, Almas, quantidade de participantes e dos Parâmetros da Temporada (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida), calcula: Pontos de um Jogador numa Partida, Ranking de Pontuação, Ranking Carrasco, Premiação da Partida, e a entrada automática correspondente no Caixa. Ver `CONTEXT.md` para a definição de cada termo.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Pontos de uma Partida = pontos da Posição (via Tabela de Pontos) + 1 × Almas
- [x] Ranking de Pontuação ordena Jogadores pela soma de Pontos na Temporada, com critério de desempate definido — confirmado com o Organizador: empate em Pontos desempata por mais Almas, empate total cai para ordem alfabética (ver CONTEXT.md).
- [x] Ranking Carrasco ordena Jogadores pela soma de Almas na Temporada, com critério de desempate definido — confirmado com o Organizador: empate em Almas desempata por mais Pontos, empate total cai para ordem alfabética (ver CONTEXT.md).
- [x] Premiação da Partida calcula o valor pago ao 1º e 2º colocados como múltiplos do Valor da Partida
- [x] Entrada automática no Caixa = (quantidade de participantes × Valor da Partida) − Premiação da Partida
- [x] Testes de regressão usando os resultados reais já apurados em `POKER 1_2026.xlsx` como fixture, com o alcance explicitado (revisado via `/code-review`):
  - Os totais de Pontos/Almas por Jogador da Temporada em andamento (dado real, extraído da aba de ranking da planilha) validam a **ordenação** dos dois rankings.
  - A Tabela de Pontos e os multiplicadores de Premiação usam os valores exatos informados pelo Organizador (vindos da mesma planilha).
  - **Não coberto por dado real**: o cálculo de Pontos por lançamento (posição+almas) e a agregação por Jogador são testados com exemplos sintéticos, não com linhas reais extraídas da planilha — a grade bruta por partida da planilha tem um layout esparso (grupos de colunas por jogador com códigos numéricos, não nomes) que seria arriscado de decifrar sem risco de atribuir posição/almas ao jogador errado. Julgamento: melhor um exemplo sintético claramente marcado como tal do que um "dado real" mal extraído.
