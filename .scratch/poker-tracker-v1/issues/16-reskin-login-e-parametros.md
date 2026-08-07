# 16 — Reskin do Login e dos Parâmetros da Temporada

**What to build:** Terceira fatia do redesign mobile-first — as duas telas de "configuração" que ainda usam HTML puro: `/login` e `/temporadas` (Parâmetros da Temporada), reskinadas com o mesmo design system verde escuro do ticket 13 (tokens, `AppShell` onde fizer sentido).

**Blocked by:** 13 (base do design system e AppShell)

**Status:** done

- [x] `/login` reskinado: formulário celular + senha com os componentes/tokens do design system (a página já ganha a `AppShell`/top bar do layout raiz, como todas as outras — não precisou de tratamento especial)
- [x] `/temporadas` reskinado: seções de Tabela de Pontos, Valores da Partida, Estrutura de Blinds (card verde-felt, mesma referência do Stitch) e Fichas Iniciais organizadas em cards, mantendo os mesmos campos e comportamento (edição enquanto aberta, criação quando não há Temporada aberta)
- [x] Ação "Encerrar Temporada" ganha confirmação em modal estilizado (resumo: total de Partidas da Temporada via `listarPartidasDaTemporada`, líder atual via `calcularRankingsDaTemporada`) em vez do `confirm()` nativo do navegador — mesma chamada a `POST /api/temporadas/[id]/encerrar`
- [x] Verificado visualmente (screenshot, mobile 430px, organizador autenticado via cookie CDP): login, `/temporadas` no modo editar e o modal de encerrar aberto; `npm test` (50/50), lint e `tsc --noEmit` limpos

**Decisão de design (importante pra quem for implementar):** entre as telas do Stitch coladas nesta rodada havia duas variantes de Login e uma de "Resultados da Temporada" em paleta dourada (`Playfair Display`/`Manrope`, textos em inglês, fotos de banco de imagem) — essa é a mesma classe de variante "fora da marca" já descartada no ticket 13 (ver seção de Decisões de design de lá). **Não usar a paleta dourada nem essas variantes como referência** — a base é sempre o tema verde escuro (`primary #95d4ac`, Hanken Grotesk/JetBrains Mono) já instalado. A tela de "Parâmetros da Temporada" colada, essa sim, já está na paleta correta e serve de referência direta de layout (cards por seção, destaque verde-felt na Estrutura de Blinds).
