# 24 — Importar a Temporada 2026.1 (planilha antiga)

**What to build:** Trazer a Temporada registrada em `POKER 1_2026.xlsx` (fev–jun/2026, antes do app existir) pro Histórico, como uma Temporada já encerrada — sem mexer na Temporada aberta atual (que já tem Partidas reais de verdade, ago/2026 em diante).

**Blocked by:** Nenhum ticket específico — pedido feito diretamente pelo Organizador.

**Status:** script pronto e validado localmente; **import em produção ainda não rodou** (ver bloqueio abaixo)

- [x] Planilha convertida pra CSV (LibreOffice headless) e parseada: 17 Partidas reais (fev–jun/2026), 12 Jogadores, cada Lançamento com Posição/Almas/Pagamento por Partida — não só o resumo final da aba AUX
- [x] Validado que o parser bate 100% com os totais oficiais da aba AUX (Pontos e Almas de cada um dos 12 Jogadores) antes de qualquer gravação
- [x] `scripts/import-temporada-2026-1.ts`: grava a Temporada (já `encerrada`), os 12 Jogadores (reaproveita por nome se já existirem — trava se achar mais de um Jogador com o mesmo nome, não adivinha), as 17 Partidas finalizadas, os Lançamentos e a entrada automática de Caixa de cada uma (via `calcularEntradaNoCaixa`, reaproveitado de `src/domain/caixa.ts`), e a saída manual registrada na planilha ("02/04/26 Retirando do caixa R$39,00 para compra de um novo baralho") — tudo numa única transação (`BEGIN`/`COMMIT`, com `ROLLBACK` em qualquer erro)
- [x] **Limitação conhecida e assumida** (decisão do Organizador): a planilha não registra quem eliminou quem, só o total de Almas por Jogador/Partida — e o schema atual (desde o ticket sobre Partida em andamento) deriva Almas de `eliminado_por_jogador_id`, não aceita um número solto. O script **reconstrói** uma cadeia de eliminações fictícia por Partida (quem ficou em 1º/2º guarda a própria alma; todo o resto recebe um eliminador tirado de um "orçamento" de créditos = Almas reais de cada um) que fecha os totais de Pontos/Almas exatamente como a planilha registrou — não é a ordem real de eliminação daquela noite
- [x] Avisado na UI: `/historico/[id]` mostra um banner (checado pela data de início da Temporada, `2026-02-03` — é histórico, não um caso recorrente, não mereceu campo novo no banco) explicando que o "eliminado por" foi reconstruído
- [x] Verificado ponta a ponta localmente: rodei o script de verdade contra o Postgres do Docker, conferi visualmente `/historico/[id]` (screenshot) — 10 dos 11 Jogadores batem exatamente com a planilha; 1 (Ueda) fica 1 ponto/1 Alma abaixo por uma inconsistência real já existente na própria planilha (ver nota)
- [ ] **Rodar de verdade em produção — bloqueado, ver abaixo**

**Nota sobre as 3 Partidas com inconsistência na planilha original** (o script avisa essas 3 no log, nada foi inventado pra "consertar" o que já estava errado na fonte):
- `2026-02-10`: Danilo e Ueda empatados em "2º lugar" na própria planilha (os dois com Pontos calculados como 2º-lugar, sem ninguém em 3º) — sobra 1 crédito de Alma sem vítima pra atribuir, descartado. Ueda perde 1 Alma/1 Ponto no total reconstruído por causa disso.
- `2026-04-07` e `2026-05-26`: a soma de Almas creditadas nessas duas Partidas é maior do que o número de gente que poderia ter sido eliminada (mais "kills" registrados do que vítimas possíveis) — sobram vítimas sem eliminador atribuível; ficam com `eliminado_por_jogador_id = NULL` (o app já trata isso como "não sabemos quem eliminou", ver CONTEXT.md).

**Bug pego durante a validação (antes de rodar de verdade em qualquer banco)**: a primeira versão do algoritmo de reconstrução (emparelhamento guloso simples, vítima↔crédito por posição) travava constantemente numa auto-eliminação (`eliminado_por_jogador_id = jogador_id`, proibido por constraint) sempre que a mesma pessoa aparecia como vítima E como fonte de crédito na mesma Partida (comum — alguém pode eliminar gente antes de ser eliminado). A correção ingênua ("pula pro próximo crédito válido") também falhava em cascata longe da causa real (um greedy sem backtracking pode travar mesmo quando existe emparelhamento válido) — resolvido tentando várias rotações da lista de créditos e ficando com a que sobra menos vítima sem eliminador. Um segundo bug real (consulta SQL de verificação cruzada errada — um JOIN a mais inflava o fan-out) fazia o relatório de validação acusar divergência enorme (até 7 Almas de diferença por Jogador) que não existia de verdade; a query foi simplificada e passou a bater com o cálculo em memória.

## Bloqueio: não consigo rodar isso em produção com as ferramentas desta sessão

`vercel env pull` busca a `DATABASE_URL`/`SESSION_SECRET` reais de produção, mas o ambiente de execução deste agente **redige (`[SENSITIVE]`) qualquer valor dessas variáveis** assim que ele passa por uma variável de shell ou é escrito em arquivo — testado e confirmado (não é falha de sintaxe: `pg_dump`, `node -e`, e até o próprio arquivo que o `vercel env pull` escreve em disco vêm com o valor trocado por esse placeholder). Isso é claramente uma proteção deliberada do ambiente contra um agente manipular segredos de produção livremente — não tentei contornar.

**Consequência prática**: nem o backup (`pg_dump`) nem a importação em si puderam ser rodados por mim contra o banco de produção. Tudo que está marcado `[x]` acima foi validado contra o Postgres **local** (Docker). O script está pronto, testado e seguro — só falta rodar apontando pra produção, o que só o Organizador consegue fazer (ele tem a `DATABASE_URL` de produção disponível via `vercel env pull` na própria máquina, fora deste sandbox).

**Comandos pro Organizador rodar** (na raiz do repo, com Node 22+ instalado):
```bash
vercel link                      # se ainda não tiver feito nesta máquina
vercel env pull .env.production.local --environment=production

# 1) Backup antes de tudo
set -a; source .env.production.local; set +a
pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup-pre-import-2026-1.sql

# 2) Dry-run (não grava nada, só mostra o relatório de validação)
DATABASE_URL="$DATABASE_URL" npx tsx scripts/import-temporada-2026-1.ts --dry-run

# 3) Se o relatório acima bater (10/11 OK, Ueda 1 ponto abaixo é esperado
#    — ver nota deste ticket), roda de verdade:
DATABASE_URL="$DATABASE_URL" npx tsx scripts/import-temporada-2026-1.ts
```
`backup-pre-import-2026-1.sql` e `.env.production.local` **não devem ir pro Git** (dados reais/credenciais) — já cobertos por `.gitignore` (`.env*.local`); apagar o `.sql` depois de confirmar que não vai precisar dele.
