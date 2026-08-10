# 40 — Timer ao vivo também na página de Blinds

**What to build:** Organizador sugeriu deixar o Timer também na página de Blinds quando houver uma Partida em andamento — facilita pra quem tem menos familiaridade com o app achar o Timer sem precisar entrar em "Partidas" e escolher a certa.

**Blocked by:** 14 (Timer), 39 (sino de notificação)

**Status:** done

- [x] `src/app/blinds/page.tsx`: busca a Partida em andamento da Temporada aberta (mesmo padrão do banner da Home, ticket 34) e, se houver, mostra o card compacto do Timer (`TimerClient`, reaproveitado — mesmo componente da página da Partida) no topo, acima da tabela estática de referência
- [x] Controles do Timer (pular/voltar nível, pausar/iniciar) só aparecem se o visitante for o Organizador logado — mesma regra de acesso já usada na página da Partida (`partidaEstaEditavelPeloOrganizador`); pra qualquer outro visitante é só leitura + sino de notificação (ticket 39), igual já funciona lá
- [x] Texto do rodapé da página ajustado — quando não tem Partida em andamento, mantém a explicação de que o Timer ao vivo aparece na página da Partida quando houver uma
- [x] Verificado via CDP: Timer aparece corretamente acima da tabela, com o sino de notificação, contagem funcionando
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
