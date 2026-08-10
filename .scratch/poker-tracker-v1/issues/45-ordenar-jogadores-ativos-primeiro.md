# 45 — Ordenar listagem de Jogadores: ativos primeiro, depois alfabética

**What to build:** Em toda listagem de Jogadores (CRUD `/jogadores`, modal "Gerenciar" na tela de Partida, checklist de participantes em "Nova Partida"), ordenar ativos antes de inativos e, dentro de cada grupo, em ordem alfabética — hoje a ordem seguia a inserção no banco (`id`), sem padrão.

**Status:** done

- [x] `src/lib/ordenar-jogadores.ts` (novo): `compararJogadoresPorAtivoENome(a, b)` — ativos antes de inativos, depois `localeCompare` com locale `pt-BR` (acentos/ç na posição certa)
- [x] `src/lib/jogadores.ts`: `listarJogadores()` — `ORDER BY ativo DESC, nome` direto no SQL (fonte de `GET /api/jogadores`, usada pelo CRUD e pelo modal "Gerenciar")
- [x] `src/app/jogadores/jogadores-client.tsx`: usa o comparador antes de renderizar a lista
- [x] `src/components/modal-gerenciar-jogadores.tsx`: idem
- [x] `src/app/partidas/nova/nova-partida-client.tsx`: lista vem de `listarJogadoresAtivos()` (já `ORDER BY nome` — sem inativos pra ordenar), então ordena só por nome ao inserir um Jogador novo na lista local; não reusa o comparador compartilhado aqui porque o tipo local (`{id, nome}`) não carrega `ativo` — não faz sentido fabricar o campo só pra um grupo que é sempre 100% ativo
- [x] `src/app/partidas/[id]/partida-em-andamento-client.tsx` (lista "fora da Partida"): já herda a ordem de `listarJogadoresAtivos()` (alfabética) via `page.tsx` — nada a mudar
- [x] Verificado direto via API local: desativar um Jogador no meio do alfabeto o move pro fim da lista, atrás de todos os ativos; reativar devolve pro lugar alfabético certo entre os ativos
- [x] `npm test` (50/50), `npm run test:integration` (83/83), lint e `tsc --noEmit` limpos
