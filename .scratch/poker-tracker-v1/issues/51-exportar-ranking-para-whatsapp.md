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

Verificado via CDP contra dados reais no Postgres do Docker: o botão na Home só aparece com uma Temporada com Ranking (confirmado testando com e sem), e o `href` de uma Partida finalizada de teste decodificou exatamente como esperado (formato original, antes do ajuste abaixo):

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

### Ajuste — tabela + eliminador (pedido do Organizador depois do primeiro deploy)

O Organizador pediu pra melhorar o formato da exportação **da Partida** (não do Ranking geral) pra parecer uma tabela de verdade e mostrar quem eliminou quem.

- [x] `formatarMensagemResultadoPartida` reescrita: em vez de uma lista com medalha por linha, monta uma tabela dentro de um bloco monoespaçado (` ``` `) — é a única forma de alinhar colunas no WhatsApp fora de código, já que negrito/itálico normais não têm largura fixa por caractere. Dentro do bloco não entra emoji (largura variável mesmo em fonte monoespaçada, desalinharia as colunas) — por isso a posição vira `1º`/`2º`/... também pro 1º/2º/3º ali dentro (a medalha continua fora, só na linha "🏆 Vitória de *Fulano*!" acima da tabela)
- [x] `montarTabela` (novo helper genérico em `whatsapp.ts`): larguras de coluna calculadas a partir do conteúdo de verdade (nomes reais, não um tamanho fixo chutado), alinhamento configurável por coluna (`Pts` à direita, resto à esquerda)
- [x] Separador de cabeçalho usa hífen simples (`-`), não `─` (box drawing) — largura garantidamente fixa em qualquer fonte monoespaçada; o caractere de desenho de caixa às vezes não é, dependendo da fonte do telefone de quem recebe
- [x] Nova coluna "Eliminado por" — `LinhaDePartidaParaExportar` ganhou `eliminadoPorNome: string | null` (`—` quando null: 1º/2º guardaram a própria Alma, ou o dado não foi registrado). `partida.lancamentos` já tinha esse campo (`LancamentoDaPartida.eliminadoPorNome`), então a chamada em `page.tsx` não precisou mudar — só o tipo em `whatsapp.ts` passou a exigi-lo
- [x] Ranking geral (`formatarMensagemRankingGeral`) **não** mudou — o pedido foi só sobre a exportação da Partida

Exemplo real gerado (`npx tsx -e`, não é print de tela, mas é a saída de verdade da função):

```
🃏 *Resultado da Partida — 10/08/2026*
🏆 Vitória de *Felipe*!

```
Pos  Jogador    Pts  Eliminado por
----------------------------------
1º   Felipe      27  —
2º   Rodrigo     19  —
3º   Ana Paula   15  Felipe
4º   Dede        12  Rodrigo
5º   Elis        10  Felipe
```

_Poker dos Amigos_
```

`npm test` (59/59, com os 2 casos novos/reescritos de `formatarMensagemResultadoPartida`), `npm run test:integration` (91/91), lint e `tsc --noEmit` limpos.
