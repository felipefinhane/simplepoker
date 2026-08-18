# 55 — Remover participante da Partida em andamento

**What to build:** Ao criar uma Partida o Organizador às vezes seleciona por engano alguém que no fim não vai jogar. Depois de criada, não tinha como tirar esse Jogador da lista de Participantes — só dava pra marcar "Saiu"/eliminado, o que não é semanticamente certo pra quem nunca participou daquela noite (gera Lançamento, Pontos "—", entra nas contas de Alma de quem "eliminou" ele por engano, etc).

**Blocked by:** 14 (Partida em andamento), 33 (Desfazer Saiu)

**Status:** done

- [x] `lib/partidas.ts`: `removerParticipante(partidaId, jogadorId)` — apaga o Lançamento (`DELETE FROM lancamentos`), só quando ainda está "vazio": sem Posição, sem Eliminador, e sem ter eliminado ninguém (`eliminadoPorJogadorId` de outro Lançamento apontando pra ele). Recusa também se derrubaria o total abaixo de `MINIMO_DE_PARTICIPANTES` (5, ver CONTEXT.md). Sem `atorId` — a linha some, não sobra onde gravar "quem removeu", e é alta frequência/baixo valor de auditoria, mesmo critério já usado em `adicionarParticipante` (ver comentário em `AcaoDeAuditoria`)
- [x] Rota `DELETE /api/partidas/[id]/participantes/[jogadorId]` — mesmo padrão de autenticação/erro das outras rotas de Partida
- [x] `PartidaEmAndamentoClient`: botão "Remover" (ícone `person_remove`) em cada linha de participante ainda Ativo — some quando ele já tem resultado lançado (aí o jeito certo é "Saiu"/"Desfazer"). Desabilitado com `title` explicando o motivo quando bloqueado (já eliminou alguém, ou mínimo de participantes); confirmação via `confirm()` antes de chamar a API. Jogador removido volta a aparecer no seletor "Adicionar Jogador" (mesma lista de quem tá de fora)
- [x] Testes de integração (`removerParticipante`, Postgres real): remove participante vazio; recusa quem não é participante; recusa quem já tem posição; recusa quem já eliminou alguém; recusa abaixo do mínimo; recusa em Partida já finalizada
- [x] Verificado ponta a ponta via Playwright (Docker Compose, `Organizador Teste`): criei Partida com 6/7 participantes, removi um Ativo sem resultado — some da lista, `Total` decrementa, reaparece no dropdown "Adicionar Jogador"; confirmei os dois bloqueios na UI de verdade (botão desabilitado + `title` certo): "Mínimo de 5 participantes." com a Partida em 5 e "Já eliminou alguém nesta Partida — não pode ser removido." pro Jogador que fez "Saiu" eliminando outro. `npm test` + `npm run test:integration` (97/97) e `tsc --noEmit`/lint limpos
