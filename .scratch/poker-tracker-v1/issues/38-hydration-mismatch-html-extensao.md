# 38 — Hydration mismatch no `<html>` por extensão de navegador (QuillBot)

**What to build:** Erro do Next.js reportado: `data-qb-installed="true"` aparecendo no `<html>` no client mas não no server — mesma classe de falso-positivo já resolvida pro `<body>` (Grammarly), agora numa extensão diferente (QuillBot) que injeta no `<html>` em vez do `<body>`.

**Blocked by:** nenhum (fix pontual, mesma classe do ajuste anterior em `layout.tsx`)

**Status:** done

- [x] Confirmado: é o mesmo padrão de extensão-de-navegador-injeta-atributo-antes-da-hidratação já diagnosticado antes, só que desta vez no elemento `<html>` (que não tinha `suppressHydrationWarning`, só o `<body>` tinha)
- [x] `src/app/layout.tsx`: `suppressHydrationWarning` adicionado também no `<html>`, comentário único explicando os dois níveis (extensões injetam tanto no `<html>` quanto no `<body>`)
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
