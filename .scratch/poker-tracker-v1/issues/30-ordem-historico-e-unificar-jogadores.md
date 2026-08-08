# 30 — Histórico em ordem cronológica + unificar Jogadores duplicados

**What to build:** Dois pedidos do Organizador depois dos imports dos tickets 24/27/28: (1) `/historico` estava ordenado por `id` da linha no banco, não pela data real da Temporada — como as Temporadas antigas foram importadas fora de ordem cronológica, a lista aparecia bagunçada (a Temporada de 2022 aparecia no topo, por exemplo). (2) "Carlos" e "Carlão" são a mesma pessoa, só grafados diferente entre planilhas de épocas diferentes — precisavam virar um cadastro só.

**Blocked by:** 24/27/28 (foram os imports que expuseram os dois problemas)

**Status:** done — ordenação deployada; unificação de Jogadores rodou em produção

- [x] `listarTemporadasEncerradas` trocou `ORDER BY id DESC` por `ORDER BY data_inicio DESC` — `/historico` agora mostra as Temporadas em ordem cronológica de verdade (mais recente primeiro), não a ordem em que cada uma foi gravada no banco
- [x] `/historico`: link "← Temporada atual" duplicado — agora aparece no topo (antes da lista) **e** no fim, como pedido
- [x] `scripts/unificar-jogadores.ts`: script genérico (reaproveitável pra qualquer duplicata futura) que repassa todos os Lançamentos (como participante e como eliminador) de um Jogador duplicado pro Jogador canônico, e apaga o duplicado — dentro de uma transação, com uma checagem de segurança embutida (recusa a unificar se achar alguma Partida onde os dois já aparecem juntos, o que indicaria que são pessoas diferentes de verdade)
- [x] Rodado localmente primeiro (`--dry-run` e depois de verdade): "Carlos" (id 69) → "Carlão" (id 56), 111 Lançamentos como participante + 78 como eliminador repassados, conferido visualmente que o Ranking da Temporada 2022 recalcula certinho (Carlão passa a mostrar 208 pts/30 Almas, os mesmos números que "Carlos" tinha antes — só o nome muda)
- [x] Rodado em produção com o mesmo backup-antes de sempre
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

**Uso do script (fica documentado aqui pra qualquer duplicata futura)**:
```bash
DATABASE_URL="..." npx tsx scripts/unificar-jogadores.ts --canonico "Nome Certo" --duplicado "Nome Errado" --dry-run
DATABASE_URL="..." npx tsx scripts/unificar-jogadores.ts --canonico "Nome Certo" --duplicado "Nome Errado"
```
