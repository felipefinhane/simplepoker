# 47 — Reskin da tela de Trocar Senha

**What to build:** `/conta/trocar-senha` nunca recebeu o tratamento visual do resto do app (ticket 13 em diante) — ficou com estilo inline cru desde antes do design system existir. Trazer pro mesmo padrão do Login: glass-card, ícones nos campos, spinner de carregando, mensagens de erro/sucesso no estilo padrão.

**Status:** done

- [x] `src/app/conta/trocar-senha/page.tsx`: reescrita seguindo o mesmo layout do `src/app/login/page.tsx` — halo de fundo, cabeçalho com ícone (`key`) + título + subtítulo, `glass-card` com campos com ícone (`lock`/`lock_reset`), botão com `IconeCarregando` enquanto envia, mensagem de sucesso com estilo próprio (verde, ícone `check_circle`) além do erro (já existia, agora com o mesmo componente de erro do resto do app), link "← Voltar" pra Home
- [x] Nenhuma mudança de comportamento/validação — mesma API (`POST /api/auth/trocar-senha`), mesmas regras (senha atual + nova com pelo menos 4 caracteres)
- [x] Verificado via CDP: tela renderiza igual ao padrão visual do Login; erro (senha atual incorreta) e sucesso (senha alterada, reaproveitando a mesma senha) aparecem corretamente, cada um isolado — um submit em sequência sem clique duplo nunca mistura os dois estados
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos
