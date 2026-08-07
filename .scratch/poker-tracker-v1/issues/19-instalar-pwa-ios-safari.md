# 19 — Instalar o PWA a partir do Safari/iOS

**What to build:** No iPhone (Safari), "Adicionar à Tela de Início" não deixava o app instalado de verdade — sem os metadados certos, o ícone salvo virava um print da página e, ao abrir, o app rodava dentro do Safari (com barra de endereço), não em tela cheia como um app instalado. Pedido feito no meio da implementação dos tickets 15-18.

**Blocked by:** Nenhum — `manifest.ts` (ticket 09) já existe e cobre Android/Chrome; Safari/iOS não usa esse manifest pra decidir como instalar, precisa dos próprios metadados.

**Status:** done

- [x] `<link rel="apple-touch-icon">` apontando pro ícone já existente (`/icons/icon-192.png`, sem transparência — recomendação da Apple) via `metadata.icons.apple` em `layout.tsx`
- [x] `metadata.appleWebApp` (`capable`, `title`, `statusBarStyle: "black-translucent"`) — gera a meta `mobile-web-app-capable` padrão e `apple-mobile-web-app-title`/`-status-bar-style`
- [x] Meta `apple-mobile-web-app-capable` (nome antigo, com prefixo `apple-`) adicionada manualmente no `<head>` — Safari anterior ao 17.4 só reconhece essa, não a `mobile-web-app-capable` padrão que o Next já gera sozinho
- [x] Verificado: HTML renderizado tem as 4 tags esperadas (`apple-touch-icon`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-capable`) além do `mobile-web-app-capable` padrão já existente; `npm test`, lint e `tsc --noEmit` limpos

**Nota:** Safari nunca mostra um banner automático de instalação (diferente do Chrome/Android) — "Adicionar à Tela de Início" continua sendo uma ação manual do usuário no menu de Compartilhar. O que estava faltando não era o botão em si, e sim o app abrir em tela cheia (sem chrome do Safari) e com um ícone de verdade depois de adicionado.
