# 04 — Cadastro de Jogadores

**What to build:** Organizador autenticado cadastra, edita e desativa Jogadores, informando apenas o nome. Jogadores desativados saem das telas de lançamento de novas Partidas mas continuam aparecendo no histórico de Partidas/Temporadas passadas em que já participaram.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Organizador cadastra um novo Jogador informando só o nome — `POST /api/jogadores`
- [x] Organizador edita o nome de um Jogador existente — `PATCH /api/jogadores/[id]` com `{ nome }`
- [x] Organizador desativa (e reativa) um Jogador sem apagar histórico — `PATCH /api/jogadores/[id]` com `{ ativo }`; a linha nunca é apagada, só marcada
- [x] Ação bloqueada para quem não está autenticado como Organizador — `requireOrganizador` em todas as rotas; página `/jogadores` redireciona pra `/login` no servidor
- [x] Lista de Jogadores ativos disponível para uso no lançamento de uma Partida (ticket 06) — `listarJogadoresAtivos()` em `src/lib/jogadores.ts`, pronta pra ser consumida

**Além do checklist literal do ticket** (revisado via `/code-review`, julgamento: manter, com uma correção real aplicada):
- Foi criada a tela `/jogadores` (não só os endpoints) e um `GET /api/jogadores` pra ela — sem uma UI, o Organizador não teria como executar essas ações de fato; consistente com como o ticket 03 também incluiu páginas de login/troca de senha.
- **Bug real corrigido**: desativar um Organizador não tinha efeito nenhum (o login ignora `ativo`), e a UI deixava clicar em "Desativar" no próprio Organizador sem avisar que não fazia nada. Agora a API recusa (`OrganizadorNaoPodeSerDesativadoError`, 400) e a UI esconde o botão pra linhas de Organizador. A semântica de "desativar um Organizador" (revogar acesso) fica como não-objetivo explícito desta v1 — ver CONTEXT.md.
- Duplicação do guard de autenticação (já sinalizada no ticket 03, virou 5 ocorrências) foi extraída para `requireOrganizadorOuResposta()`, usado em todas as rotas restritas até aqui.
