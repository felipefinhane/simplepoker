# 20 — Rebrand: "Poker dos Amigos" + ícone de espada

**What to build:** Trocar o nome exibido do app de "Simplepoker" para "Poker dos Amigos", e o ícone (PWA/apple-touch-icon/favicon) por um símbolo de espada de baralho (♠), mantendo a paleta verde já estabelecida. Pedido feito diretamente pelo Organizador, fora do fluxo normal de ticket-primeiro.

**Blocked by:** Nenhum

**Status:** done

- [x] `metadata.title` e `appleWebApp.title` (`layout.tsx`) — título da aba/instalado
- [x] `manifest.ts`: `name: "Poker dos Amigos"`, `short_name: "Poker Amigos"` (nome curto pra caber sob o ícone na tela de início)
- [x] Header do `AppShell` (logo + nome) e o ícone de destaque do `/login` trocados pro glifo ♠ (Unicode `U+2660`, texto simples, cor `primary`) no lugar do ícone Material Symbols `style` usado antes como logo
- [x] `public/icons/icon-192.png` e `icon-512.png` regenerados: fundo `#0f5132` (mesmo `primary-container` da marca) com uma espada branca centralizada (gerados via PIL/`LiberationSans-Bold`, único font local com o glifo ♠ preenchido — `Noto Sans Symbols` não tinha esse codepoint, renderizava tofu)
- [x] `src/app/favicon.ico` regenerado no mesmo estilo (16/32/48px) — corrigido de RGB pra **RGBA** depois de um erro real do Turbopack em dev (`The PNG is not in RGBA format!`) that só apareceu ao rodar local, não no `tsc`/lint
- [x] Verificado visualmente (screenshot mobile) — header, login, favicon e manifest servido (`/manifest.webmanifest`) com os novos valores; `npm test` (50/50), lint e `tsc --noEmit` limpos

**Fora do escopo (decisão consciente):** não renomeei o repositório, `README.md`/`CONTEXT.md` (título "Simplepoker" como identidade do projeto/repo), nem `package.json.name` — o pedido foi especificamente sobre o nome **exibido do app**, e mexer no nome do repo/remoto é uma decisão maior (afeta o remote do Git, o nome do projeto na Vercel, etc.) que não foi pedida aqui.
