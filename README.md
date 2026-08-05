# Simplepoker

Webapp para gerenciar o campeonato de poker semanal de um grupo de amigos — ranking, resultados de partida e caixa. Veja `CONTEXT.md` para o glossário do domínio e `.scratch/poker-tracker-v1/` para o spec e os tickets da v1.

## Rodando localmente (Docker)

Único pré-requisito: [Docker](https://docs.docker.com/get-docker/) instalado. Não precisa de Node.js nem Postgres na máquina.

```bash
docker compose up
```

- App: http://localhost:3000
- Health-check (confirma que o app está de pé e conectado ao banco): http://localhost:3000/api/health
- O Postgres local roda na porta `5432` (usuário/senha/banco: `simplepoker`), com os dados persistidos num volume Docker entre reinícios.
- Edições em arquivos do projeto recarregam o app automaticamente (hot reload via bind mount).

Para derrubar e limpar os containers:

```bash
docker compose down        # mantém os dados do banco
docker compose down -v     # apaga também os volumes (banco zerado)
```

## Rodando localmente sem Docker (alternativa)

Se preferir não usar Docker, precisa de Node.js 22+ e um Postgres acessível:

```bash
cp .env.example .env.local   # ajuste DATABASE_URL se necessário
npm install
npm run dev
```

## Deploy (produção)

Pensado para rodar inteiramente em camadas gratuitas:

1. **Banco de dados**: crie um Postgres gerenciado gratuito (ex: [Neon](https://neon.tech) ou [Supabase](https://supabase.com)) e copie a connection string.
2. **Hospedagem**: crie um projeto na [Vercel](https://vercel.com) apontando para este repositório (o build usa o Next.js nativamente — o `Dockerfile.dev` é só para desenvolvimento local, não é usado no deploy).
3. Configure a variável de ambiente `DATABASE_URL` no projeto da Vercel com a connection string do passo 1.
4. Deploy automático a cada push no branch principal.

## Testes e checagem de tipos

```bash
npm run lint
npx tsc --noEmit
```
