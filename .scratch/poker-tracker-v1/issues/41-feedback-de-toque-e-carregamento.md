# 41 — Feedback de toque e indicador de carregamento em todo o app

**What to build:** Organizador relatou que, ao clicar em algo, o app "parece que não fez nada" — na verdade estava processando, só sem feedback visual nenhum. Pediu (a) um efeito de toque tipo botão pressionado, e (b) algum indicador de carregamento durante ações. Perguntou se precisava desenhar algo — não precisou, tudo com o design system já existente.

**Blocked by:** nenhum

**Status:** done

- [x] **Causa raiz do "efeito de toque zero":** `-webkit-tap-highlight-color: transparent` (em `globals.css` desde o início do projeto) tira o flash cinza padrão do navegador ao tocar, sem nenhum substituto — qualquer botão do app não dava feedback nenhum de toque
- [x] `globals.css`: efeito global de toque — qualquer `<button>` habilitado encolhe (`scale(0.96)`) e perde um pouco de opacidade no `:active`, sem precisar tocar em cada componente individualmente. `:disabled` explicitamente sem esse efeito, pra não parecer clicável enquanto já desabilitado/carregando
- [x] `src/components/icone-carregando.tsx` (novo): spinner reaproveitável (`progress_activity` do Material Symbols + `animate-spin` padrão do Tailwind), tamanho em pixels via `style` (não uma classe, pra nunca disputar com outra classe de tamanho já presente no botão)
- [x] Spinner ligado em toda ação assíncrona relevante do app:
  - Login, trocar de senha (essa página não tem o design system aplicado — só ganhou o `:active` global, resto fora de escopo aqui)
  - Jogadores: cadastrar novo Jogador
  - Nova Partida: cadastrar Jogador inline, criar Partida
  - Caixa: lançar Saída manual
  - Temporada: salvar Parâmetros, confirmar Encerramento
  - Timer (`use-timer.ts`): agora rastreia qual controle (`acaoEmAndamento`) está em requisição — o botão clicado mostra o spinner, os outros ficam desabilitados (evita clique duplo/concorrente) — vale tanto pro card compacto quanto pra tela cheia (voltar/pular/pausar-iniciar/reiniciar/encerrar)
  - Notificação do Timer (sino): já tinha `carregando`, só faltava o spinner visual (antes só desabilitava)
  - Partida em andamento: Pagou, Desfazer, fluxo "Saiu"/Confirmar, editor manual (posição/eliminador), editar data, adicionar Jogador (existente ou novo cadastro), Finalizar Partida
- [x] **Dois bugs reais encontrados no caminho** (não só falta de spinner):
  - `jogadores-client.tsx`: o toggle Ativo/Inativo é um checkbox controlado que só atualizava o estado local depois da resposta do servidor — sem isso, o switch "piscava" (voltava pra posição antiga por um instante, esperando o fetch, só then virava de vez), parecendo que o toque não tinha registrado. Corrigido pra atualizar otimisticamente na hora, desfazendo se o servidor recusar
  - `partida-em-andamento-client.tsx`: o botão "Confirmar" do fluxo "Saiu" fechava a UI (voltava a mostrar o botão "Saiu") **antes** da resposta do servidor chegar — na janela entre o clique e a resposta, dava pra clicar "Saiu" de novo por engano, parecendo que o primeiro clique não tinha feito nada. Corrigido pra só fechar depois que o `await` da chamada de verdade terminar
- [x] Verificado via CDP com a rede propositalmente lenta (`Network.emulateNetworkConditions`, 1.2s de latência) pra conseguir capturar o meio do caminho: spinner aparece em "Pular Nível" (Timer) com os outros controles desabilitados, e no fluxo "Saiu" (spinner na linha do Jogador)
- [x] `npm test` (50/50, local e Docker), lint e `tsc --noEmit` limpos

**Fora de escopo (intencional):** `src/app/conta/trocar-senha/page.tsx` nunca recebeu o reskin do design system (Stitch) — só ganhou o `:active` global aqui, não os spinners específicos; e o "Sair" (logout) do menu não ganhou spinner porque termina numa navegação de página inteira logo em seguida, que já é sinal visual suficiente de "algo aconteceu".
