# 37 — Beep de troca de nível não tocava no celular

**What to build:** Depois do ticket 36 (auto-avanço de nível), Organizador confirmou que o beep já resolve por enquanto, mas relatou que no celular o beep simplesmente não acontece.

**Blocked by:** 36

**Status:** done

- [x] Causa raiz: `tocarAlerta` criava um `AudioContext` novo a cada troca de nível, sempre de dentro do polling em segundo plano — nunca a partir de um toque direto do usuário. Política de autoplay de áudio do navegador (bem mais rígida em iOS Safari, mas também vale pra Chrome Android) mantém um `AudioContext` recém-criado fora de um gesto do usuário em estado `suspended`: nenhum som sai, e sem erro nenhum — por isso parecia simplesmente "não fazer nada"
- [x] `use-timer.ts`: agora existe um único `AudioContext` compartilhado (módulo, não por componente), criado e destravado (`.resume()`) no primeiro toque na página (`pointerdown`/`keydown`, registrado uma vez por instância do `useTimer`) — depois disso, `tocarAlerta` reaproveita esse mesmo contexto já destravado pra tocar o beep, mesmo quando disparado sozinho pelo polling (sem gesto novo), incluindo um `.resume()` defensivo por chamada pro caso do navegador suspender de novo ao voltar de segundo plano
- [x] Verificado via CDP (viewport mobile, gesto real via `Input.dispatchMouseEvent`, que conta como user-activation): toque cria e destrava o contexto compartilhado uma única vez; ao forçar o auto-avanço de nível (ticket 36) minutos depois, sem nenhum gesto novo, o beep dispara reaproveitando o mesmo contexto (`resume()` + `createOscillator()` confirmados via instrumentação)
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** ainda depende de o usuário ter tocado em algo na página **antes** da primeira troca de nível (abrir o app, navegar, clicar em qualquer botão já basta) — não tem como destravar áudio sem nenhuma interação alguma, é limitação do navegador, não do app. Continua sendo só em primeiro plano (não é notificação push), igual já combinado no ticket 36.
