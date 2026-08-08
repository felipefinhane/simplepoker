# 27 — Importar as Temporadas 2024.2 e 2025.2

**What to build:** Mais duas Temporadas antigas trazidas pro Histórico, junto com a 2026.1 do ticket 24: **2025.2** (`POKER 02_2025.xlsx`, ago–out/2025) e **2024.2** (planilha à parte no Google Sheets, ago–dez/2024 — link passado pelo Organizador). Mesmo padrão: gravadas como Temporadas já encerradas, sem mexer na Temporada aberta.

**Blocked by:** 24 (extraiu o padrão e a lógica de reconstrução de eliminações, reaproveitada aqui)

**Status:** scripts prontos e validados localmente; **import em produção ainda não rodou** (mesmo bloqueio do ticket 24 — credencial de produção redigida pelo ambiente do agente)

- [x] `scripts/lib/importar-temporada-historica.ts`: extraído do script do ticket 24 — núcleo compartilhado (reconstrução de eliminações, gravação transacional, relatório de validação) reaproveitado pelos 3 scripts de import agora
- [x] `scripts/import-temporada-2025-2.ts`: 13 Partidas (ago–out/2025), 11 Jogadores — parseado de `POKER 02_2025.xlsx`
- [x] `scripts/import-temporada-2024-2.ts`: 19 Partidas (ago–dez/2024), 11 Jogadores (incluindo 2 novos: Galego e Carlos) — parseado de uma planilha Google Sheets separada; inclui a saída manual registrada ("Quebra de caixa — sumiu a grana durante o semestre", R$ 23, 03/12/2024) e a Estrutura de Blinds/Fichas Iniciais reais dessa Temporada (a única das 3 com essa aba preenchida)
- [x] **Descoberta importante, mudou como o Caixa é gravado nessas duas Temporadas**: ao contrário da 2026.1 (multiplicador fixo — 1º=2×, 2º=1× o Valor da Partida), essas duas usavam **Premiação percentual do pote** (2025.2: 1º=40%/2º=20%; 2024.2: 1º=50%/2º=30%), que varia com a quantidade de participantes — não é redutível a um multiplicador fixo, o único modelo que o schema atual (`multiplicadorPremiacaoPrimeiro/Segundo`) suporta. Confirmado batendo 100% com a coluna "$" (entrada líquida) já calculada nas duas planilhas originais, pra cada uma das 32 Partidas. `PartidaImportada.entradaNoCaixa` (novo campo opcional no core compartilhado) grava esse valor real direto, sem recalcular via `calcularEntradaNoCaixa` — os campos de multiplicador ficam `0` nos Parâmetros dessas Temporadas (não usados, só preenchidos porque a coluna é NOT NULL)
- [x] **Segunda descoberta, essa sim gera uma pequena divergência aceita**: nessas duas Temporadas mais antigas, várias Partidas têm um 1º ou 2º colocado registrado com Alma abaixo do que a regra atual do app pressupõe (`calcularAlmas` sempre credita +1 pra quem termina em 1º/2º, incondicional — não dá pra desligar isso só pra Partidas antigas). Resultado: o total de Pontos/Almas de alguns Jogadores fica **1 a 2 acima** do que a planilha original tinha — 5 Jogadores na 2024.2 (Felipe, Galego, Turati, Sergio, Danilo, todos +1 ou +2), 1 na 2025.2 (Sergio, +1). Todos os outros (6/11 e 10/11 respectivamente) batem exatos
- [x] Banner de aviso em `/historico/[id]` generalizado (checagem por lista de datas em vez de uma só) pra cobrir as 3 Temporadas importadas, com o texto atualizado explicando essa segunda divergência também
- [x] Verificado localmente: rodei os dois scripts de verdade contra o Postgres do Docker, conferi visualmente `/historico` e `/historico/[id]` de cada uma — Saldo do Caixa bate exato com o "TOTAL EM CAIXA"/"TOTAL MESA" de cada planilha original (2025.2: R$ 452,00; 2024.2: R$ 295,00); `npm test` (50/50), lint e `tsc --noEmit` limpos

**Rodar em produção** — mesmo fluxo do ticket 24 (backup primeiro):
```bash
vercel env pull .env.production.local --environment=production
set -a; source .env.production.local; set +a

pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup-pre-import-2024-2-e-2025-2.sql

npx tsx scripts/import-temporada-2025-2.ts --dry-run
npx tsx scripts/import-temporada-2025-2.ts

npx tsx scripts/import-temporada-2024-2.ts --dry-run
npx tsx scripts/import-temporada-2024-2.ts
```
