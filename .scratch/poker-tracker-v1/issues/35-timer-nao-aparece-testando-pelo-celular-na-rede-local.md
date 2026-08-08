# 35 — Timer (e todo o app) não ficava interativo testando pelo celular na rede local

**What to build:** Depois do ticket 34, Organizador testou de novo — "Estou testando local com o timer" / "não aparece" — mas dessa vez pelo celular acessando o ambiente Docker local pela rede Wi-Fi (IP tipo `192.168.x.x:3000`), não produção.

**Blocked by:** 31 (seed local), 34 (banner)

**Status:** done

- [x] Reproduzido com CDP: HTML servido pelo IP da rede local é idêntico ao de `localhost`, e todos os assets (`_next/static/...`) carregam com 200 — mas o React nunca hidrata (`TimerClient` nunca chega a renderizar, zero chamadas de `fetch`, log `[HMR] connected` nunca aparece). Confirmado que o mesmo acontece com `127.0.0.1`, não é específico de rede — é qualquer host que não seja literalmente `localhost`
- [x] Causa raiz encontrada no log do container: `⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "127.0.0.1"` — o dev server do Next só aceita o WebSocket de HMR vindo de `localhost` por padrão; sem ele, o app carrega o HTML mas o bootstrap do React nunca completa, então nada fica interativo (Timer, toggles, botões — tudo, não só o Timer)
- [x] `next.config.ts`: adicionado `allowedDevOrigins: ["192.168.*.*", "10.*.*.*"]` — cobre as faixas de IP privado mais comuns em rede doméstica/escritório, só tem efeito em `next dev` (`docs/.../allowedDevOrigins.md`), zero impacto em produção
- [x] Verificado via CDP (mobile viewport, cookies limpos) contra o IP da rede local: Timer volta a renderizar (`Nível 2 de 13`, blinds, contagem), banner da Home (ticket 34) também aparece normal
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** é uma limitação só do ambiente de desenvolvimento local — em produção (Vercel) esse bloqueio não existe, então nunca afetou o app publicado.
