# 14 — Reskin da Partida em andamento, detalhe público e Timer

**What to build:** Segunda fatia do redesign mobile-first — as telas mais usadas durante o jogo em si: a Partida (tanto o modo de gestão do Organizador quanto o detalhe só-leitura pra visitantes) e o Timer de blinds, agora com um card compacto embutido na Partida e uma tela cheia dedicada pra deixar o celular apoiado na mesa.

**Blocked by:** 13 (base do design system e AppShell)

**Status:** ready-for-agent

- [x] Lógica de polling/ações do Timer extraída num hook compartilhado (`use-timer.ts`) — usado tanto pelo card compacto quanto pela tela cheia, sem duplicar a lógica
- [x] Card compacto do Timer (`timer-client.tsx`) reskinado: nível, blinds, contagem grande, próximo nível, controles rápidos (voltar/pausar-iniciar/pular nível) e um ícone de expandir que leva pra tela cheia
- [x] Nova rota `/partidas/[id]/timer` — tela cheia do Timer, com os controles menos usados (Reiniciar, Encerrar) que não estão no card compacto, e botão de voltar
- [x] `partidaEstaEditavelPeloOrganizador` extraída em `src/lib/partidas.ts` — mesma regra de "pode editar" usada tanto na Partida quanto na tela do Timer, uma fonte só
- [x] Partida em andamento (`partida-em-andamento-client.tsx`) reskinada: cada participante é um card (Ativo/Eliminado, quem eliminou, Pagou, Almas, Pontos); o botão "Saiu" continua sendo o fluxo rápido, e um editor manual (ícone de lápis, expande posição + eliminador) continua cobrindo o fluxo "lançar tudo no final" — as duas opções pedidas continuam coexistindo
- [x] "Adicionar Jogador" virou um único botão que abre um painel com as duas formas de adicionar (jogador já cadastrado ou cadastrar um novo), em vez de dois formulários sempre visíveis
- [x] Detalhe da Partida só-leitura (visitante, `ResultadoDaPartida` em `page.tsx`) reskinado: lista de participantes com posição, quem eliminou, Almas e Pontos, com destaque visual pro 1º e 2º lugar
- [x] Verificado visualmente (screenshot real) nas quatro combinações: Partida como Organizador (com o Timer rodando), Partida pública (só-leitura), Timer em tela cheia como Organizador (5 controles) e Timer em tela cheia público (só-leitura)

**Decisões de design**:
- Timer em tela cheia continua dentro do `AppShell` (barra superior + bottom nav visíveis) em vez de um "modo quiosque" sem nenhum chrome — um modo realmente sem chrome exigiria múltiplos layouts raiz via route groups do Next.js (reestruturar toda a árvore de rotas só pra essa tela), custo alto pra um ganho marginal já que a barra é fina e não atrapalha a leitura à distância.
- Achado durante a implementação (não veio de review, pego na hora de escrever): o seletor de "Eliminado por" do editor manual precisa aceitar **qualquer** participante, não só os ainda ativos — diferente do fluxo rápido "Saiu" (que exige um eliminador ativo, ver `marcarSaida`), a edição manual (`atualizarLancamento`) sempre aceitou qualquer participante da Partida como eliminador. Um rascunho inicial do componente só oferecia os ativos nesse seletor, o que quebraria silenciosamente ao tentar visualizar/editar um Lançamento cujo eliminador já tivesse sido eliminado também — corrigido antes de qualquer revisão ou commit.
- Uso do CDP (Chrome DevTools Protocol) diretamente, sem Puppeteer/Playwright instalados, pra tirar screenshot autenticado (injeta o cookie de sessão via `Network.setCookie`, já que é HttpOnly e não dá pra usar `document.cookie`) — documentado aqui porque não é um padrão óbvio, útil pra verificações futuras.

**Achados do `/code-review` e correções aplicadas antes de commitar**:
- `LinhaDoParticipante` renomeada pra `LinhaDeLancamento` (e os comentários ajustados) — CONTEXT.md pede pra evitar "Participante" como nome pro conceito de Jogador (`_Avoid_: Participante` na entrada de Jogador), e esse era um nome de componente novo, não herdado. Mantive "participante"/"Participantes" como palavra comum em textos de UI e nas mensagens de erro (ex: "Faltam N participantes sem posição") — isso já é como o resto de `src/lib/partidas.ts` fala (criado nos tickets 06/10, nunca questionado em revisão), então trocar só o texto novo criaria inconsistência em vez de resolver.
- JSDoc de `partidaEstaEditavelPeloOrganizador` citava uma função (`carregarPartidaEditavel`) que não existe mais — corrigido pra citar só `travarPartidaEditavel`.
- `timer-client.tsx` e `timer-tela-cheia-client.tsx` tinham a mesma mensagem de "sem Estrutura de Blinds" e a mesma lógica do botão Iniciar/Pausar (ícone trocando, aria-label) duplicadas — extraídas em `MENSAGEM_SEM_ESTRUTURA_DE_BLINDS` (`use-timer.ts`) e `BotaoPlayPause` (novo `botao-play-pause.tsx`, parametrizado por tamanho).

**Correção pós-deploy**: uma Partida finalizada não precisa mais de Timer (o jogo já acabou) — o card compacto deixou de aparecer em `page.tsx` quando `partida.finalizada`, e a rota `/partidas/[id]/timer` redireciona de volta pra `/partidas/[id]` nesse caso, em vez de continuar acessível mostrando um estado congelado.
