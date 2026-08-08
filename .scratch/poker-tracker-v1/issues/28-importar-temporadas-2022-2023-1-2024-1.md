# 28 — Importar as Temporadas 2022, 2023.1 e 2024.1

**What to build:** Mais três Temporadas antigas (o Organizador passou 4 links do Google Sheets — dois eram a mesma planilha duplicada, ver nota abaixo). Mesmo padrão dos tickets 24/27: gravadas como Temporadas já encerradas, sem mexer na Temporada aberta.

**Blocked by:** 27 (núcleo compartilhado `importar-temporada-historica.ts`, reaproveitado sem alteração)

**Status:** scripts prontos e validados localmente; **import em produção ainda não rodou** (mesmo bloqueio dos tickets 24/27)

- [x] **Link duplicado detectado antes de importar**: dos 4 links passados, o 1º e o 3º eram a mesma planilha (mesmo conteúdo, byte a byte nas abas RANKING/PONTUACAO/AUX/BLINDS) — Temporada 2023.1. Importada uma vez só.
- [x] `scripts/import-temporada-2022.ts`: 40 Partidas (fev–dez/2022, a maior Temporada até agora), 11 Jogadores — nenhum novo (mesmo elenco de Mica/Felipe/Danilo/Edinho/Nino/Galego/Turati/Enio/Sergio/Carlos/Ueda das Temporadas 2024.x)
- [x] `scripts/import-temporada-2023-1.ts`: 19 Partidas (fev–jun/2023)
- [x] `scripts/import-temporada-2024-1.ts`: 22 Partidas (jan–jun/2024) — junto com a 2024.2 (ticket 27), fecha o ano de 2024 inteiro
- [x] Mesmo modelo de Premiação percentual do pote (50%/30%, igual às Temporadas do ticket 27) — `entradaNoCaixa` de cada Partida gravado direto da planilha
- [x] **Bug real pego na validação, antes de gravar em qualquer banco**: o parser assumia que "não jogou" sempre aparecia como `-` na planilha, igual às Temporadas anteriores — a 2024.1 usa `0` em vez de `-` pra jogador ausente. Sem o ajuste, todo mundo aparecia em toda Partida (11 participantes em Partidas que na real tinham só 5-10), inflando Pontos/Almas de forma grosseira (ex: Turati apareceria com 67 pts em vez de 49). Corrigido no parser antes de gerar os dados do script — nenhuma linha chegou a ser gravada com o bug.
- [x] **Divergência de Caixa real, encontrada e corrigida (Temporada 2022)**: a soma das entradas por Partida (fórmula 50%/30%, batendo 100% com a coluna "$" da planilha) menos as saídas manuais dava R$ 10,00, mas a própria planilha registrava Caixa final R$ 0,00. A planilha tinha duas notas manuais explicando exatamente isso — "Nino entregou somente R$14 da mesa, pois pagaram prêmio para o terceiro colocado" (22/03) e "Entregaram somente R$10" (08 ou 09/11) — os valores batem exato com a diferença de R$10. `entradaNoCaixa` dessas duas Partidas foi ajustado pro valor realmente entregue (14 e 10, não os 16/18 que a fórmula padrão daria); com isso o Saldo do Caixa final bate exatamente com o R$ 0,00 da planilha.
- [x] **Divergência de Caixa NÃO resolvida (Temporada 2024.1, disclosed)**: o mesmo cálculo dá Saldo R$ 317,00, mas a planilha registra R$ 297,00 — uma diferença de R$ 20,00 sem nota nenhuma na planilha explicando. Todas as 22 Partidas batem 100% com a fórmula 50%/30%, os Pontos/Almas de todos os 11 Jogadores batem exato — não achei fonte confiável pra ajustar, então **não inventei um ajuste** (ao contrário da 2022, onde a nota batia exato). Documentado no cabeçalho do script; o Saldo do Caixa dessa Temporada específica pode ficar R$20 acima do real.
- [x] **Fora do escopo, de propósito**: a aba "AJUDA CUSTO CHACARA" (presente nas planilhas de 2022/2023.1) rastreia uma cobrança mensal de rateio do aluguel do local onde jogam — um controle financeiro completamente diferente do Caixa do campeonato (buy-in/premiação/despesas de Partida). Não é o mesmo conceito do `Caixa` do domínio (ver CONTEXT.md) e não foi importado.
- [x] Mesma limitação já disclosed nos tickets 24/27 (1º/2º sem a alma própria em algumas Partidas antigas) — 5 Jogadores na 2022 (+1 cada), 1 na 2023.1 (Ueda, +1), 5 na 2024.1 (+1 ou +2 cada), todos os outros batendo exato. Banner já cobre (checagem por lista de datas, sem precisar de mudança nova)
- [x] Verificado localmente: rodei os três scripts de verdade contra o Postgres do Docker — `/historico` e `/historico/[id]` de cada uma conferidos visualmente, Saldo do Caixa batendo com cada planilha (2022: R$ 0,00; 2023.1: R$ 66,00); `npm test` (50/50), lint e `tsc --noEmit` limpos

**Rodar em produção** — mesmo fluxo dos tickets anteriores (backup primeiro):
```bash
vercel env pull .env.production.local --environment=production
set -a; source .env.production.local; set +a

pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup-pre-import-2022-2023-1-2024-1.sql

npx tsx scripts/import-temporada-2023-1.ts --dry-run && npx tsx scripts/import-temporada-2023-1.ts
npx tsx scripts/import-temporada-2024-1.ts --dry-run && npx tsx scripts/import-temporada-2024-1.ts
npx tsx scripts/import-temporada-2022.ts --dry-run && npx tsx scripts/import-temporada-2022.ts
```

Depois desse import, o Histórico cobre: 2022 (ano inteiro), 2023.1, 2024.1, 2024.2, 2025.2 e 2026.1 — só falta 2023.2 (se existir/for encontrada) pra fechar todos os semestres desde 2022.
