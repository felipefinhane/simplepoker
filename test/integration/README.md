# Testes de integração

Testes aqui precisam de um Postgres real e rodam à parte do `npm test`
(que fica rápido e sem dependências externas). `getSession`/
`getOrganizadorLogado` dependem de `cookies()` do Next.js (só existe numa
requisição de verdade), então esses testes chamam direto as funções que só
dependem do banco (`autenticarOrganizador`, `trocarSenha`) — a parte de
cookie/sessão já foi verificada manualmente contra o app rodando via Docker
Compose.

## Rodando

Com o Postgres do `docker-compose.yml` no ar (`docker compose up -d db`):

```bash
DATABASE_URL=postgres://simplepoker:simplepoker@localhost:5432/simplepoker \
SESSION_SECRET=00000000000000000000000000000000000000000000000000000000000000 \
npm run test:integration
```

Ou de dentro do container: `docker compose exec app npm run test:integration`.
