# 29 — Reskin de Jogadores e Nova Partida + cadastro inline

**What to build:** `/jogadores` e `/partidas/nova` eram as duas últimas páginas do fluxo do Organizador ainda em HTML puro (ver nota do ticket 13: "as quatro últimas não vieram do Stitch... Jogadores + Temporada/Parâmetros + Login + Nova Partida" — Temporada e Login já saíram no ticket 16, essas duas ficaram pra trás). Reportado pelo Organizador junto com dois problemas que pareciam bugs mas eram consequência direta do HTML sem estilo: o toggle Ativo/Inativo (um `<button>` de texto solto, sem feedback visual nenhum) parecia não funcionar, e não havia como cadastrar um Jogador novo direto do fluxo de criar Partida.

**Blocked by:** 13 (design system base)

**Status:** done

- [x] `/jogadores` reskinado: card de cadastro (ícone + input + botão), lista com avatar, nome editável inline, badge Ativo/Inativo, contadores (Ativos/Inativos) no cabeçalho, e um switch de verdade (`ToggleAtivo` — checkbox real por baixo, visual custom, sem CSS solta) no lugar do botão de texto
- [x] **O toggle Ativo/Inativo nunca esteve quebrado** — testado ponta a ponta (clique real via CDP + conferido direto na API): `PATCH /api/jogadores/[id]` e `listarJogadoresAtivos` (usado por `/partidas/nova`) sempre funcionaram; o que faltava era ficar visualmente claro que era clicável e o que fazia
- [x] `/partidas/nova` reskinado: campo de data em card, participantes como cards selecionáveis (checkbox + avatar + nome), contador "N selecionados · faltam M" (usa `MINIMO_DE_PARTICIPANTES`), botão de criar desabilitado com o texto explicando quantos faltam
- [x] **Cadastro de Jogador novo direto no fluxo de Nova Partida** (não existia): mesmo padrão já usado em "Adicionar Jogador" na Partida em andamento (ticket 14) — um botão "Cadastrar novo Jogador" abre um mini-formulário que cria o Jogador (`POST /api/jogadores`) e já marca ele como selecionado, sem sair da tela
- [x] Verificado visualmente (screenshot) e funcionalmente (clique real via CDP): toggle Ativo/Inativo confirmado persistindo no banco; cadastro inline em Nova Partida confirmado — Jogador novo aparece na lista já selecionado e o contador atualiza; `npm test` (50/50), lint e `tsc --noEmit` limpos
