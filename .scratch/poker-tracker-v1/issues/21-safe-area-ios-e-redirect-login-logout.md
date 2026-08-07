# 21 — Safe-area do rodapé no iPhone + redirect de login/logout

**What to build:** Dois problemas reportados depois de instalar o PWA no iPhone: (1) o `BottomNavBar` ficava colado ao indicador de início (home indicator) do iPhone, fácil de acionar sem querer o gesto de minimizar o app ao tocar perto do rodapé; (2) login e logout devem sempre levar de volta pra página principal (`/`).

**Blocked by:** Nenhum — corrigido junto com o rebrand (ticket 20), pedido na mesma conversa.

**Status:** done

- [x] `viewport.viewportFit: "cover"` adicionado em `layout.tsx` — sem isso, `env(safe-area-inset-bottom)` resolve pra `0` no Safari/iOS (mesmo em modo standalone), então o `pb-safe` do `BottomNavBar` (`env(safe-area-inset-bottom, 20px)`) nunca aplicava o inset de verdade, só a barra ficava sem padding nenhum de segurança. Verificado via CDP (`Emulation.setSafeAreaInsetsOverride`, simulando um inset de 34px como um iPhone com Face ID): antes do fix o `env()` computava `0px`, depois passou a computar `34px` de verdade
- [x] Login (`/login`) e logout (`AppShell`) trocados de `router.push("/") + router.refresh()` pra `window.location.href = "/"` (navegação completa, não client-side) — mais robusto especificamente dentro do PWA instalado no iPhone, onde a navegação via History API dentro de um web app em modo standalone é historicamente instável no Safari; também garante que o layout raiz reavalia `getOrganizadorLogado()` do zero. `eslint-disable` pontual com comentário (regra `@next/next/no-location-assign-relative-destination`, que existe pra evitar isso no caso comum — aqui é a exceção deliberada)
- [x] Verificado com automação real de clique (CDP, preenchendo os inputs pelo setter nativo do React — `.value =` direto não dispara o `onChange` controlado) — login e logout continuam levando pra `/` com a navegação nova
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** não consegui reproduzir o sintoma de login/logout "não redirecionava" com o código anterior num teste automatizado direto (`router.push` já levava pra `/`) — o mais provável é ter sido uma combinação de PWA instalado com bundle antigo em memória entre os deploys desta sessão. A troca pra navegação completa é uma correção defensiva mesmo assim: elimina de vez essa classe de instabilidade específica de PWA standalone no iOS, então vale manter.
