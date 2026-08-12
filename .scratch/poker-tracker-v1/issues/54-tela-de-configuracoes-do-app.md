# 54 — Tela de Configurações do app

**What to build:** Tela nova (`/configuracoes`), acessível **sem login**, reunindo preferências do app que não são específicas de uma Partida — a primeira leva é o interruptor global de notificações (ticket 48) e o modo daltonismo (ticket 53). Motivo de existir separada do menu de conta atual: aquele menu (`AppShell`, ícone `account_circle`) só aparece pro Organizador logado, e essas duas preferências são de quem quer que esteja usando o app no próprio celular, logado ou não — normalmente nem é o Organizador.

**Blocked by:** Nenhum — mas os tickets 48 (interruptor global de notificação) e 53 (modo daltonismo) dependem desta tela pra ter onde morar.

**Status:** done

- [x] Nova rota `/configuracoes` (`src/app/configuracoes/page.tsx`), pública (sem `requireOrganizador`) — mesmo padrão de página pública já usado em `/`, `/blinds`
- [x] Novo ícone (`settings`) no header (`AppShell`, `src/components/app-shell.tsx`), ao lado do ícone de conta existente — os dois agora ficam num `<div className="flex items-center gap-1">` comum; não entra no dropdown de conta (esse continua só pro Organizador logado) nem virou item na bottom nav
- [x] Layout com os dois primeiros itens: `ToggleNotificacaoGlobal` (ticket 48) e `ToggleDaltonismo` (ticket 53), cada um no próprio arquivo dentro de `src/app/configuracoes/`
- [x] `ToggleDaltonismo` é 100% client-side (`localStorage`, ver ticket 53); `ToggleNotificacaoGlobal` depende de rede (Web Push, ver ticket 48)

## Comments

- Verificado via CDP (Playwright headless): `/configuracoes` renderiza as duas linhas, o ícone de engrenagem no header navega pra lá, e o toggle de daltonismo alterna a paleta ao vivo (`--color-primary` de `#95d4ac` pra `#7ec8f2`) sem erro de console.
- `npm test` (58/58), `npm run test:integration` (91/91), lint e `tsc --noEmit` limpos.
