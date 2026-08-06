# 07 — Ranking público e histórico

**What to build:** Qualquer visitante, sem login, acessa o Ranking de Pontuação e o Ranking Carrasco da Temporada atual, o detalhe de qualquer Partida já lançada (Posição, Almas e Pontos por Jogador), e a lista de Temporadas encerradas com seus rankings finais.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] Ranking de Pontuação da Temporada atual visível sem login — página `/` (home)
- [x] Ranking Carrasco da Temporada atual visível sem login — mesma página `/`
- [x] Detalhe de uma Partida (Posição/Almas/Pontos por Jogador) visível sem login — `/partidas/[id]` virou dual-modo: somente-leitura pra visitante (ou pro próprio Organizador quando a Temporada da Partida já está encerrada), formulário editável só quando Organizador logado **e** Temporada aberta
- [x] Lista de Temporadas encerradas, cada uma com seu ranking final, visível sem login — `/historico` (lista) e `/historico/[id]` (ranking final daquela Temporada)
- [x] Páginas acessíveis e legíveis tanto no computador quanto no celular — tabelas em grid responsivo (`repeat(auto-fit, minmax(...))`) e com scroll horizontal próprio, sem quebrar layout em telas estreitas

**Peças novas de infraestrutura**:
- `src/lib/rankings.ts`: agrega os Lançamentos de todas as Partidas já lançadas de uma Temporada e aplica o núcleo de cálculo do ticket 02 (`agregarResultadosPorJogador`, `calcularRankingDePontuacao`, `calcularRankingCarrasco`). Só considera Partidas com `posicao IS NOT NULL` — como lançar é atômico (ticket 06), isso nunca inclui uma Partida "meio lançada".
- `listarPartidasDaTemporada` adicionada em `src/lib/partidas.ts`, pra listar as Partidas de uma Temporada específica (a home e o histórico precisavam disso; `listarPartidas` já existente lista todas, de todas as Temporadas).
- Componente compartilhado `src/components/rankings-da-temporada.tsx`, reusado pela home (Temporada atual) e por `/historico/[id]` (Temporada passada) — mesma exibição, fonte de dados diferente.

**Bug real corrigido (achado ao construir esta página, não pela revisão)**: `temporadas.ts` devolvia `dataInicio`/`dataFim` como objeto `Date` do driver `pg`, não string — o mesmo problema do `partidas.data` corrigido no ticket 06, só que ninguém tinha renderizado esses campos ainda pra revelar. Corrigido na função `linhaParaTemporada`.

**Correções aplicadas na revisão (`/code-review`)**:
- **Risco real de corrupção de dados corrigido**: a agregação dos rankings usava o **nome** do Jogador como chave (`AgregadoDoJogador.jogadorId`, tipo do ticket 02) — como `nome` não tem unicidade garantida no banco (só `telefone` é único), dois Jogadores com o mesmo nome teriam seus Pontos/Almas misturados silenciosamente. Corrigido pra agregar pelo **id numérico** de verdade, resolvendo o nome só no final, pra exibição. Teste de integração novo cria dois Jogadores homônimos de propósito e confirma que continuam sendo duas entradas distintas no ranking. Efeito colateral aceito: o desempate alfabético final passa a ordenar pelo id, não pelo nome — só importa no caso raro de empate total, e correção de dados pesa mais.
- A lista pública de Partidas (na home e em `/historico/[id]`) mostrava Partidas ainda não lançadas — agora filtrada por `partidaEstaLancada` (novo helper em `src/lib/partidas.ts`, também reaproveitado na lista do Organizador em `/partidas`, que tinha essa mesma checagem duplicada inline).
- `/historico/[id]` tinha um branch morto pra exibir a Temporada aberta (nunca acontece na prática, já que `/historico` só lista encerradas) — removido; acessar o id da Temporada aberta por essa rota agora dá 404 (ela vive em `/`).
- Filtro de Temporadas encerradas movido de dentro da página `/historico` pra `listarTemporadasEncerradas()` em `src/lib/temporadas.ts`, seguindo o padrão já usado por `listarJogadoresAtivos`/`listarPartidasDaTemporada`.
- `rankings-da-temporada.tsx` declarava seu próprio tipo `EntradaDeRanking`, duplicando o de `src/lib/rankings.ts` — agora importa o real.
