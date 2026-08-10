# 46 — Reabrir Temporada encerrada + confirmação digitada pra encerrar

**What to build:** Organizador perguntou se dá pra reabrir uma Temporada encerrada por engano (ou porque vai rolar mais uma Partida na mesma) — hoje "Encerrar" era descrito como irreversível de verdade. Pediu também pra trocar a confirmação de um clique por um texto digitado, já que mesmo com a tela de confirmação é fácil clicar sem querer.

**Blocked by:** 44 (usa `atualizado_por_jogador_id`/`registrarEvento` do rastreamento de atividade)

**Status:** done

- [x] `src/lib/temporadas.ts`: nova `reabrirTemporada(id, atorId)` — volta `aberta = true` e zera `data_fim`; recusa se a Temporada já está aberta (`TemporadaJaAbertaError`) ou se já existe outra Temporada aberta no momento (`JaExisteTemporadaAbertaError`, reaproveitado); registra evento de auditoria `temporada.reaberta`. O `UPDATE` também captura violação do índice único parcial `temporada_aberta_unica` (mesmo padrão de `criarTemporada`) — o pré-check sozinho não fecha a corrida entre reabrir uma e criar/reabrir outra ao mesmo tempo
- [x] `src/lib/auditoria.ts`: `"temporada.reaberta"` adicionado ao union de ações
- [x] `src/app/api/temporadas/[id]/reabrir/route.ts` (novo): `POST`, mesma auth do `encerrar` (`requireOrganizadorOuResposta`), 409 nos dois casos de conflito
- [x] `src/app/historico/[id]/reabrir-temporada-button.tsx` (novo): botão só pro Organizador, na página de detalhe de uma Temporada encerrada; confirmação simples (`confirm()`, não a digitada) — reabrir é a direção segura da ação, ao contrário de encerrar; redireciona pra `/` depois (a Temporada volta a ser "a aberta")
- [x] `src/app/historico/[id]/page.tsx`: busca o Organizador logado e renderiza o botão condicionalmente
- [x] `src/app/temporadas/temporada-client.tsx` (`ModalEncerrarTemporada`): campo de texto "Digite ENCERRAR pra confirmar" — botão "Confirmar e Encerrar" só libera com o texto certo (case-insensitive); textos do modal e da seção "Zona de Perigo" atualizados pra não chamarem mais a ação de irreversível, já que agora dá pra reabrir
- [x] Verificado via API local: reabrir uma já aberta → 409 "já está aberta"; reabrir com outra Temporada aberta ao mesmo tempo → 409 "encerre-a primeiro"; encerrar → reabrir com sucesso, `data_fim` volta a `null`, os dois eventos (`temporada.encerrada`/`temporada.reaberta`) aparecem em `eventos_de_auditoria` com o `jogador_id` de quem fez
- [x] Verificado via CDP: botão "Confirmar e Encerrar" nasce desabilitado, continua desabilitado com texto errado, libera com "encerrar" em minúsculo; botão "Reabrir Temporada" aparece em `/historico/[id]` de uma Temporada encerrada
- [x] `npm test` (50/50), `npm run test:integration` (88/88, com 5 testes novos pra `reabrirTemporada`, incluindo a corrida real reabrir-vs-criar), lint e `tsc --noEmit` limpos
