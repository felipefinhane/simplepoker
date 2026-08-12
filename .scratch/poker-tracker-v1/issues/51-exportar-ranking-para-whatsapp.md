# 51 — Exportar Ranking (geral e da Partida) pro WhatsApp

**What to build:** Botão que gera uma mensagem formatada com o Ranking — tanto o Ranking de Pontuação geral da Temporada quanto o resultado de uma Partida específica — e abre o WhatsApp (`wa.me`) com o texto pronto, pro Organizador escolher pra quem/qual grupo mandar.

**Blocked by:** Nenhum.

**Status:** done

- [x] `src/lib/whatsapp.ts` (novo): `formatarMensagemRankingGeral`/`formatarMensagemResultadoPartida` (texto com formatação do próprio WhatsApp — `*negrito*`, medalhas 🥇🥈🥉, `4º`/`5º` a partir do 4º lugar) e `linkDoWhatsapp(mensagem)` (monta a URL `wa.me`)
- [x] `BotaoExportarWhatsapp` (`src/components/botao-exportar-whatsapp.tsx`) — **sem nenhum JS no cliente**: é só uma âncora `<a href="https://wa.me/?text=...">`, o navegador/OS decide se abre o app do WhatsApp (celular) ou o WhatsApp Web (desktop); não precisou virar Client Component
- [x] Botão na Home (`/`, Ranking geral) — só aparece se `rankingDePontuacao.length > 0`
- [x] Botão na página de detalhe de uma Partida (`/partidas/[id]`) — só aparece se `partida.finalizada` (resultado em andamento ainda pode mudar)
- [x] Limite de tamanho: `LIMITE_SEGURO_DE_CARACTERES = 1800` em `linkDoWhatsapp` — trunca com "…" se passar disso (rede de segurança; um Ranking de grupo de amigos não chega perto)
- [x] Testado manualmente: URL gerada abre corretamente decodificada (ver Comments) — não dá pra testar o "abre o app do WhatsApp de verdade" num ambiente headless, mas o link `wa.me` em si é o mecanismo documentado/padrão, sem partes exóticas

## Comments

Verificado via CDP contra dados reais no Postgres do Docker: o botão na Home só aparece com uma Temporada com Ranking (confirmado testando com e sem), e o `href` de uma Partida finalizada de teste decodificou exatamente como esperado:

```
🃏 *Resultado da Partida — 2026-08-05*

🥇 Ana VisualCheck — 29 pts
🥈 Beto VisualCheck — 20 pts
🥉 Caio VisualCheck — 15 pts
4º Dede VisualCheck — 12 pts
5º Elis VisualCheck — 10 pts

_Poker dos Amigos_
```

`npm test` (58/58, incluindo 6 casos novos de `src/lib/whatsapp.test.ts`), `npm run test:integration` (91/91), lint e `tsc --noEmit` limpos.
