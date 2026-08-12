# 53 — Modo acessibilidade para daltonismo

**What to build:** Alternativa de tema/paleta pro app, pra quem tem daltonismo — sem depender só de cor pra passar informação importante (ex: pago/não pago, saldo do Caixa positivo/negativo, sino de notificação do ticket 49, badge de Temporada aberta/encerrada). Decidido: implementado direto no código (paleta alternativa + reforço com ícone/texto/padrão), sem gerar design novo no Stitch — o pedido não é uma tela nova, é um tema em cima do que já existe.

**Blocked by:** 54 (o toggle mora na tela de Configurações). Fica melhor revisado depois do ticket 49 também, que mexe na mesma área de cor de estado do sino — evita retrabalho.

**Status:** done

- [x] Levantados os lugares que comunicam estado só por cor: o único par verde/vermelho de verdade no app é `primary`/`error` no Caixa (entrada/saída) e nas cores derivadas deles (`primary-container`, `error-container`, etc. — usadas também pra "Ativo"/"Eliminado" na Partida em andamento). Os outros candidatos já tinham reforço: o "Pagou" é um `<input type="checkbox">` (ícone de marcado, não só cor), a linha de entrada/saída do Caixa já tem seta (`arrow_downward`/`arrow_upward`) + sinal (`+`/`−`) + texto, e o badge "Encerrada" do Histórico usa `tertiary` (neutro), não vermelho/verde
- [x] Paleta alternativa definida: troca `primary`/`error` (verde/vermelho — o par mais difícil pra deuteranopia/protanopia, a forma mais comum de daltonismo) por azul/laranja, via `html[data-daltonismo="true"]` em `globals.css` — `secondary`/`tertiary` não mudam, não formam par semântico "bom/ruim" em nenhuma tela
- [x] Reforço visual: como o Caixa e o "Ativo"/"Eliminado" já tinham ícone/texto além da cor (ver primeiro item), a troca de paleta sozinha já resolve o pedido sem precisar adicionar ícones novos em lugar nenhum
- [x] Toggle simples "ligado/desligado" (não granular por tipo de daltonismo) — `ToggleDaltonismo` (`src/app/configuracoes/toggle-daltonismo.tsx`), `localStorage`, sem servidor
- [x] Aplicado via CSS custom properties — reaproveita o mecanismo de tokens já existente (`@theme` do Tailwind v4 em `globals.css`), só sobrescrito num seletor mais específico, nenhum sistema paralelo
- [x] Sem flash da paleta errada: script inline no `<head>` (`layout.tsx`) seta `data-daltonismo` a partir do `localStorage` antes do primeiro paint; `ToggleDaltonismo` usa `useSyncExternalStore` (não `useState`+`useEffect`, que o lint do projeto rejeita pra esse padrão) pra ler/alternar o valor ao vivo

## Comments

- Verificado via CDP: `--color-primary` muda de `#95d4ac` (verde) pra `#7ec8f2` (azul) ao clicar no toggle, o atributo `data-daltonismo="true"` sobrevive a um reload da página (script inline funcionando), e volta a `#95d4ac` ao desligar. Sem erro de console.
- `npm test` (58/58), `npm run test:integration` (91/91), lint e `tsc --noEmit` limpos.

**Fora de escopo aqui:** simulador de daltonismo de verdade (extensão de navegador) pra validar as cores exatas — a escolha azul/laranja segue a recomendação geral (par Okabe-Ito), mas não foi validada com uma ferramenta dedicada nesta rodada.
