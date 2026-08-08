# 39 — Notificação push de troca de nível (iOS + Android)

**What to build:** O beep (ticket 37) continuava não confiável no iPhone (iOS suspende `AudioContext` de novo depois de segundo plano, e o interruptor de silencioso muda tons de Web Audio) — Organizador pediu notificação push de verdade, funcionando em iOS e Android (navegador desktop, se possível, mas não prioridade).

**Blocked by:** 36 (auto-avanço), 37 (beep)

**Status:** done

- [x] Par de chaves VAPID gerado (um pra dev local, hardcoded no `docker-compose.yml` — não é segredo de verdade, só destrava o botão testando local; outro pra produção, salvo no Vercel via `vercel env add` — `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- [x] Migration `push_subscriptions`: inscrição por Partida (não por Organizador — qualquer visitante pode ativar "avisar quando o blind mudar" no próprio celular, igual ao beep já funciona pra qualquer um), `UNIQUE (partida_id, endpoint)` — reabrir o app atualiza em vez de duplicar
- [x] `src/lib/push.ts`: `salvarInscricao`/`removerInscricao`/`notificarMudancaDeNivel` (usa a lib `web-push`) — sem chaves VAPID configuradas, tudo vira no-op silencioso (não quebra o resto do Timer)
- [x] `src/lib/timer.ts`: `mudarNivel` (pular/voltar manual) e `avancarNiveisVencidos` (automático, ticket 36) agora chamam `notificarMudancaDeNivel` depois de commitar a transação (chamada de rede — nunca seguraria lock nem falharia a troca de nível se o envio der erro)
- [x] Limpeza automática: inscrição que responde 404/410 (revogada pelo navegador) é removida do banco na mesma chamada
- [x] `public/sw.js`: handlers `push` (mostra a notificação, com `tag` por Partida — a próxima troca substitui a anterior em vez de empilhar) e `notificationclick` (foca a aba já aberta ou abre uma nova na tela do Timer)
- [x] `use-notificacoes-do-timer.ts` (novo hook) + `botao-notificacao.tsx` (novo componente, sino) — usado tanto no card compacto (`TimerClient`) quanto na tela cheia (`TimerTelaCheiaClient`); detecta suporte do navegador via `useSyncExternalStore` (não `useEffect` + `setState`, pra não disparar o novo lint `react-hooks/set-state-in-effect` e continuar seguro em SSR)
- [x] **iOS só recebe push no app instalado** (Adicionar à Tela de Início — restrição da própria Apple desde iOS 16.4, Safari "solto" nunca recebe nada): detectado via `display-mode: standalone` / `navigator.standalone`; nesse caso o botão vira um ícone "notificação indisponível" com dica explicando pra instalar o app primeiro, em vez de sumir sem explicação
- [x] Verificado ponta a ponta local (CDP, permissão concedida via `Browser.grantPermissions`): botão aparece, clique pede permissão → inscreve no `PushManager` → salva no banco (`push_subscriptions` populada com endpoint real do FCM); forçando uma troca de nível depois, `web-push` envia sem erro nenhum no log do servidor
- [x] `npm test` (50/50), `npm run test:integration` (78/78, incluindo os 20 do Timer — sem regressão nas mudanças do ticket 36/37), lint, `tsc --noEmit` e `next build` (produção) limpos

**Não verificado por mim (precisa de teste no dispositivo real):** entrega de fato da notificação — som, aparência, funcionamento com o app em segundo plano/celular bloqueado — em iPhone e Android reais. Ambiente sandboxed/headless não reproduz a experiência final de notificação do SO. Depois de instalar o app de novo (o service worker mudou) e ativar o sino na tela do Timer, testar de verdade numa Partida em andamento.
