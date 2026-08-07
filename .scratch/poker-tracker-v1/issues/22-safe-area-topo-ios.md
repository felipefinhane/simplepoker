# 22 — Safe-area do topo no iPhone (TopAppBar sob o notch)

**What to build:** Depois do `viewport-fit=cover` do ticket 21 (necessário pro rodapé), o `TopAppBar` do `AppShell` passou a ficar embaixo do notch/Dynamic Island/relógio no PWA instalado do iPhone — o mesmo problema do rodapé, só que no topo, e causado pela própria correção anterior (antes do `viewport-fit=cover` o Safari reservava essa área sozinho; com `cover`, quem passa a ser responsável por isso é a página).

**Blocked by:** 21

**Status:** done

- [x] Utility `pt-safe` criada em `globals.css` (`padding-top: env(safe-area-inset-top, 0px)`), espelhando o `pb-safe` já existente
- [x] Aplicada no único header fixo do app (`AppShell`, usado por toda página — não há headers próprios em nenhuma tela): `h-14` trocado por `min-h-14` (senão o padding extra espremia o conteúdo em vez de aumentar a barra) + `pt-safe`
- [x] Verificado via CDP (`Emulation.setSafeAreaInsetsOverride`, simulando 47px de inset no topo como um iPhone com Dynamic Island): logo e ícone de conta agora renderizam claramente abaixo da área reservada, sem sobreposição
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
