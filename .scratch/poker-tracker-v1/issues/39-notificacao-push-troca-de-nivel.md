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

## Correção — sino não aparecia no iPhone

Organizador testou e o sino simplesmente não aparecia (nada, nem o ícone desabilitado). Causa: `detectarSuporte` checava "o navegador suporta push?" **antes** de checar "é iOS sem estar instalado?" — no Safari do iOS, `window.PushManager` só existe dentro do app instalado (a API nem é exposta numa aba comum), então qualquer iPhone testando pelo Safari solto caía direto em `"sem-suporte"` (botão escondido) em vez de `"precisa-instalar-no-ios"` (ícone desabilitado com a dica de instalação).

- [x] Reordenado: iOS é checado primeiro — `"precisa-instalar-no-ios"` (não instalado) → `"ios-desatualizado"` (instalado, mas iOS < 16.4, sem `PushManager` mesmo assim) → `"suportado"`. Só cai em `"sem-suporte"` (escondido) fora do iOS
- [x] Novo estado `"ios-desatualizado"` com mensagem própria (pedindo pra atualizar o iOS), reaproveitando o mesmo ícone/popover de dica do "precisa instalar"
- [x] Verificado via CDP simulando o Safari do iOS de verdade (user agent + `PushManager` removido de `window`, do jeito que a Apple realmente expõe/esconde a API): os três estados (não instalado / instalado mas desatualizado / suportado) renderizam certo agora
- [x] `npm test` (50/50, local e dentro do Docker), lint e `tsc --noEmit` limpos

## Correção — mensagem "precisa de iOS 16.4" enganosa

Organizador confirmou estar em iOS 16.4+ e mesmo assim viu essa mensagem — a suposição "sem `PushManager` mesmo `standalone` = iOS desatualizado" não é a única causa possível: um ícone adicionado à Tela de Início *antes* de alguma correção de manifest/metadata (ex: tickets 19-22) pode nunca ter sido reconhecido pela Apple como app instalado de verdade pra fins de push, mesmo num iOS novo.

- [x] Mensagem trocada pra não afirmar "seu iOS é antigo" sem certeza — orienta primeiro remover e reinstalar o ícone da Tela de Início (causa mais provável nesse caso), e só depois verificar a versão do iOS como possibilidade secundária
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

## Correção — causa raiz real: falso-negativo na detecção (não era o dispositivo)

Organizador confirmou: já tinha reinstalado o ícone (não era isso) e não existe nenhuma entrada em Ajustes → Notificações pro app — ou seja, o navegador nunca sequer chegou a pedir permissão, porque o app achava (errado) que não tinha suporte.

Causa raiz: `detectarSuporte` checava `"PushManager" in window` — o construtor global — de forma síncrona, logo no primeiro render. No Safari do iOS, parece que esse global só fica disponível depois que o service worker termina de registrar (diferente do Chrome, onde já existe desde o início) — checar cedo demais dava falso "sem suporte" mesmo num app recém-instalado em iOS novo, e como o app nunca tentava `Notification.requestPermission()`, o iOS nunca criava a entrada em Ajustes (consistente com o que o Organizador viu).

- [x] Trocado pra checar via `"pushManager" in registro` (a propriedade da *registration* do service worker, não o global de `window`) — forma correta segundo a spec, e só é checada depois de `navigator.serviceWorker.ready` resolver, sem a corrida
- [x] `detectarSuportePrecoce` (síncrono, via `useSyncExternalStore`) agora só decide o que dá pra saber na hora sem esperar nada: "sem chave VAPID" e "iOS sem estar instalado". Tudo mais vira `"verificando"` até a checagem assíncrona (dentro de um `useEffect`, `setState` só no `.then()` — sem repetir o erro de lint do início) confirmar `"suportado"`/`"ios-desatualizado"`/`"sem-suporte"`
- [x] Verificado via CDP simulando exatamente o cenário problemático (iOS + standalone + `window.PushManager` deletado, como o Safari real pareceria antes do service worker ficar pronto): o botão real de ativar aparece agora, em vez do ícone de indisponível — confirma que não depende mais do global cedo demais
- [x] Reconferido que os outros dois estados (não instalado / genuinamente sem suporte) continuam corretos
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

## Correção — sino sumiu de novo depois de reinstalar (regressão da correção anterior)

Organizador removeu e reinstalou o ícone (de novo) e dessa vez o sino nem apareceu — nenhum ícone, nem o desabilitado. Causa: a correção anterior trocou pra esperar `navigator.serviceWorker.ready` resolver antes de decidir se mostra o botão — mas nesse app recém-reinstalado (registrando o service worker pela primeira vez de novo, do zero), essa promessa aparentemente nunca resolveu, deixando o estado travado em `"verificando"` pra sempre (que corretamente não mostra nada — só que "pra sempre" não é uma opção boa).

Terceira tentativa, mais simples e sem depender de nenhuma promessa: no iOS, se `estaInstaladoComoPwa()` bater, mostra o botão direto — é exatamente o que a Apple documenta como suficiente, sem tentar confirmar `PushManager` de antemão. Se de fato não tiver suporte, isso só aparece na hora de clicar "Ativar" (erro claro, com dica), não mais como o botão inteiro sumindo sem explicação.

- [x] `detectarSuporte` volta a ser 100% síncrono — sem `useEffect`/promessa nenhuma decidindo se o botão aparece. iOS instalado → `"suportado"` direto
- [x] Estado `"ios-desatualizado"` removido (não tinha mais como chegar nele de forma confiável) — se `registro.pushManager` realmente não existir, `ativar()` mostra um erro específico na hora, num popover visível (não só `title`, que não aparece em toque no celular)
- [x] Verificado via CDP simulando o pior caso — `navigator.serviceWorker.ready` que nunca resolve (uma `Promise` que nunca resolve nem rejeita, imitando exatamente a suspeita) — e o botão aparece normalmente mesmo assim
- [x] Reconferido: instalado normal, não instalado, e o fluxo completo de inscrição (Chrome/Android) continuam funcionando
- [x] `npm test` (50/50, local e Docker), lint e `tsc --noEmit` limpos

**Nota sobre testar push localmente no Android:** confirmado que instalar via `https://poker.finhane.com` funciona (e o beep já funciona local). Pra testar push de verdade no Docker local pelo Android, o Chrome também exige "origem segura" pra Service Worker/Notificação — não só pra instalabilidade. Solução: no Chrome do Android, abrir `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, ativar e adicionar `http://<IP-da-rede-local>:3000` (ex: `http://192.168.15.7:3000`) — depois disso o site local passa a ser tratado como seguro o bastante pra Service Worker/Push funcionarem normalmente.
