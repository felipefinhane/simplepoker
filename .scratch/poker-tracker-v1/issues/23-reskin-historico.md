# 23 — Reskin do Histórico de Temporadas

**What to build:** Reskin de `/historico` (lista de Temporadas encerradas — hoje é uma `<ul>` sem estilo) e um complemento visual em `/historico/[id]` (que já usava `RankingsDaTemporada` desde o ticket 13, mas ainda faltavam stats da Temporada — total de Partidas e total arrecadado — conforme a nota deixada no ticket 13: "o reskin completo dessa página... ainda fica pro ticket de Histórico").

**Blocked by:** 13 (design system base)

**Status:** done

- [x] `/historico`: cada Temporada encerrada vira um card (mesmo padrão visual do "season-card" do Stitch) com badge "Encerrada", intervalo de datas, Campeão (líder do Ranking de Pontuação daquela Temporada) e dois stats — Total de Partidas e Total Arrecadado (`Σ participantes × Valor da Partida` de cada Partida finalizada)
- [x] `/historico/[id]`: adicionado o mesmo par de stat-cards (Total de Partidas / Total Arrecadado) acima do `RankingsDaTemporada` já existente, e o cabeçalho ganhou o badge "Encerrada" e a formatação de data consistente com o resto do app
- [x] Verificado visualmente (screenshot mobile) com uma Temporada de teste real encerrada localmente; `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** "Total Arrecadado" é derivado (participantes × Valor da Partida por Partida, somado), não um campo novo no banco — consistente com a regra de "cálculo derivado, não redundante" já seguida pro resto do domínio (ver `spec.md`).
