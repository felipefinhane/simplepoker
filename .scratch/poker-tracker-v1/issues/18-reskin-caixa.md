# 18 — Reskin do Caixa e do lançamento de saída

**What to build:** Reskin de `/caixa` (hoje uma tabela HTML simples) com o design system do ticket 13: banner de saldo em destaque, extrato como lista de cards por transação (entrada/saída com ícone e cor), e o formulário de lançar saída manual do Organizador com a mesma linguagem visual. Sem mudança de comportamento — a página já é pública (`/caixa` não redireciona hoje; só o formulário de saída é condicionado a `organizador`), e o card 18 é puramente visual.

**Blocked by:** 13 (base do design system e AppShell)

**Status:** done

- [x] Banner de "Saldo do Caixa" reskinado, em destaque no topo (valor grande em `text-display-score`, cor `secondary`, halos decorativos)
- [x] Extrato (`listarTransacoesDaTemporada`) reskinado como lista de cards, um por transação: ícone de entrada (verde) ou saída (vermelho), data, descrição, valor — mantendo a distinção `entrada_partida` (texto fixo "Entrada — resultado de Partida") vs `saida_manual` (descrição livre) já existente
- [x] Formulário de lançar saída (`SaidaManualForm`, visível só pro Organizador logado) reskinado: campos de data/valor/descrição com os inputs do design system, botão de ação consistente com o resto do app
- [x] Estado "Nenhuma Temporada aberta" e "Nenhuma movimentação ainda" também reskinados
- [x] Verificado visualmente (screenshot) como visitante e como Organizador, mobile (390px) e desktop (1280px), com Partida real finalizada (entrada automática) + uma saída manual lançada; `npm test` (50/50), lint e `tsc --noEmit` limpos

**Notas:**
- A tela "Caixa do Grupo" colada do Stitch (paleta verde, mesma família de tokens do resto) serve de referência direta de layout.
- Sem escopo de paginação/filtro por mês nesta ticket — se o extrato crescer muito isso pode virar um ticket futuro; aqui é só o reskin do que já existe.
