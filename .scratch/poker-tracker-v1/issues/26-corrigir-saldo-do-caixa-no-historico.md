# 26 — Corrigir "Total Arrecadado" errado no Histórico

**What to build:** Bug real, reportado pelo Organizador comparando com o banco: o stat que o ticket 23 chamou de "Total Arrecadado" em `/historico` e `/historico/[id]` somava `participantes × Valor da Partida` de cada Partida (bruto, sem descontar a Premiação paga ao 1º/2º) — R$ 1.430,00 pra Temporada 2026.1, quando o saldo real do Caixa daquela Temporada é R$ 881,00 (esse "881" já estava na própria planilha original, na linha `TOTAL MESA` — bateu exatamente depois da correção).

**Blocked by:** 23 (introduziu o cálculo errado), 24 (foi a Temporada importada que expôs a diferença — R$ 10/Partida × Premiação de R$ 30/Partida × 17 Partidas = R$ 510 de diferença)

**Status:** done

- [x] `/historico` e `/historico/[id]` trocaram o cálculo manual (`Σ participantes × valorDaPartida`, bruto) por `calcularSaldoDaTemporada` (já existente em `src/lib/caixa.ts`, usado por `/caixa`) — soma real de `entrada_partida` (que já desconta a Premiação) menos `saida_manual`
- [x] Label do card também corrigido de "Arrecadado"/"Total Arrecadado" pra "Saldo do Caixa", pra não sugerir de novo que é o valor bruto
- [x] Verificado: Temporada 2026.1 agora mostra R$ 881,00 (bate com a linha "TOTAL MESA" da planilha original — inclui a saída manual de R$ 39 da compra de baralho); `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** ambas as páginas já buscavam `listarPartidasDaTemporada` de qualquer forma (pra "Total de Partidas" e pro `RankingsDaTemporada`) — só trocou a fonte do segundo número, sem query nova além do `calcularSaldoDaTemporada` (que já era usado por `/caixa`, mesmo padrão).
