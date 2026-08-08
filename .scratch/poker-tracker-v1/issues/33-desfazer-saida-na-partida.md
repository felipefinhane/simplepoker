# 33 — Desfazer "Saiu" na Partida em andamento

**What to build:** No fluxo rápido "Saiu" (Partida em andamento), o Organizador às vezes seleciona o eliminador errado ou clica "Saiu" no Jogador errado por engano — não tinha um jeito rápido de reverter isso, só o editor manual (ícone de lápis), que exige limpar o campo Posição na mão.

**Blocked by:** 14 (fluxo "Saiu" original)

**Status:** done

- [x] `LinhaDeLancamento`: Jogador já eliminado (`!estaAtivo`) ganha um botão **"Desfazer"** (ícone `undo`, mesmo padrão do mockup "Partida em Andamento" original) que chama `atualizarLancamento` com `{ posicao: null, eliminadoPorJogadorId: null }` — volta ele pro estado "Ativo" na hora, sem precisar abrir o editor manual
- [x] Reaproveita `atualizarLancamento`/`onAtualizar` já existente — nenhuma rota nova, nenhuma mudança de schema; `validarEliminador` já trata `eliminadoPorJogadorId: null` como caso trivial (sempre válido)
- [x] Verificado ponta a ponta: criei uma Partida de teste, marquei "Saiu" com eliminador (Chico eliminado por Danilo), cliquei em "Desfazer" via clique real (CDP) — Chico volta pra "Ativo", e a Alma que Danilo tinha ganho pela eliminação some junto (`almas` recalculado, confirmado pela API); `npm test` (50/50), lint e `tsc --noEmit` limpos
