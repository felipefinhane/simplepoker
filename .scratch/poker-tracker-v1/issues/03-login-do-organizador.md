# 03 — Login do Organizador

**What to build:** Autenticação para o papel Organizador: login com número de celular e senha (senha inicial = 4 últimos dígitos do celular), fluxo de troca de senha, e sessão persistida (cookie). Nenhuma outra ação restrita do sistema funciona sem isso. Jogadores comuns não autenticam nesta versão (v2).

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Organizador loga com celular + senha inicial (4 últimos dígitos do celular) — conta criada via `npm run seed:organizador` (não há cadastro de Organizador pela UI nesta versão; a spec também não pede essa tela)
- [x] Senha armazenada com hash, nunca em texto puro (bcrypt via `bcryptjs`)
- [x] Organizador consegue trocar a senha (`/conta/trocar-senha`, exige a senha atual)
- [x] Sessão persiste entre requisições (cookie assinado via `iron-session`, `httpOnly`/`sameSite=lax` explícitos)
- [x] Tentativa de login com senha errada é rejeitada — alcance explicitado (revisado via `/code-review`):
  - `autenticarOrganizador`/`trocarSenha` (a lógica de credencial contra o Postgres) têm teste de integração automatizado (`test/integration/`).
  - O ciclo HTTP completo — login seta o cookie, requisições seguintes autenticam por ele, logout destrói a sessão — foi **verificado manualmente** (curl) nesta sessão, não por teste automatizado; automatizar isso ficaria para quando houver mais rotas protegidas justificando o investimento.
- [x] Rotas/ações restritas verificam sessão de Organizador válida — `requireOrganizador` em `src/lib/auth/organizador.ts`, usado de verdade por `/api/auth/me` e `/api/auth/trocar-senha` (não só declarado — religado depois da revisão pegar que estava sem uso), reutilizável pelos próximos tickets.

**Decisões de infraestrutura introduzidas por este ticket** (fora do escopo literal de "login", mas necessárias pra ele existir com persistência real — revisado via `/code-review`, julgamento: manter):
- `node-pg-migrate` para gerenciar o schema (`migrations/`) — o projeto vai precisar de migrations de qualquer forma a partir daqui (Temporada, Partida, Caixa nos próximos tickets).
- Suíte de teste separada em unitário (`npm test`, sem dependências) e integração (`npm run test:integration`, precisa de Postgres) — necessário pra testar autenticação com persistência real sem tornar o `npm test` padrão dependente de banco.
- Bug corrigido durante a revisão: telefone não era normalizado de forma consistente entre o cadastro e o login (`"11 99999-8888"` vs `"11999998888"` não batiam) — agora `normalizarTelefone` é aplicado nos dois pontos.
