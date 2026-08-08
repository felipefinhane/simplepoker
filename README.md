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
- Migrations pendentes (`migrations/`) são aplicadas automaticamente toda vez que o container `app` sobe.
- **Banco vazio já sobe populado** (`scripts/seed-dev.ts`, idempotente — só roda em banco sem nenhum Jogador): cria o Organizador de teste, um elenco de Jogadores e uma Temporada aberta com os Parâmetros padrão, pra já dar pra testar (ex: criar uma Partida) sem cadastrar nada na mão. Login: `11999998888` / senha `8888`.
- Edições em arquivos do projeto recarregam o app automaticamente (hot reload via bind mount).

**Depois de adicionar uma dependência nova** (`npm install ...`), rode `docker compose down -v` antes do próximo `docker compose up --build` — o `node_modules` local roda num volume Docker nomeado, que não é substituído sozinho quando a imagem é reconstruída (ele "gruda" nas dependências antigas).

Para derrubar e limpar os containers:

```bash
docker compose down        # mantém os dados do banco
docker compose down -v     # apaga também os volumes (banco e node_modules zerados)
```

### Criando o primeiro Organizador

O `docker compose up` já cria um Organizador de teste sozinho (ver seção acima). Pra usar seu próprio nome/telefone em vez do padrão, ou recriar depois de um `docker compose down -v`:

```bash
docker compose exec -e ORGANIZADOR_NOME="Seu Nome" -e ORGANIZADOR_TELEFONE="11999998888" \
  app npm run seed:organizador
```

A senha inicial é os 4 últimos dígitos do telefone informado (trocável em `/conta/trocar-senha` depois de logar em `/login`). Não existe cadastro de Organizador pela interface — o login (telefone + senha) já pressupõe uma conta existente.

## Rodando localmente sem Docker (alternativa)

Se preferir não usar Docker, precisa de Node.js 22+ e um Postgres acessível:

```bash
cp .env.example .env.local   # ajuste DATABASE_URL e SESSION_SECRET
npm install
npm run migrate:up
npm run dev
```

## Deploy (produção)

Pensado para rodar inteiramente em camadas gratuitas:

1. **Banco de dados**: crie um Postgres gerenciado gratuito (ex: [Neon](https://neon.tech) ou [Supabase](https://supabase.com)) e copie a connection string (prefira a versão com pooler, se disponível — importante para hospedagem serverless).
2. **Hospedagem**: crie um projeto na [Vercel](https://vercel.com) apontando para este repositório (o build usa o Next.js nativamente — o `Dockerfile.dev` é só para desenvolvimento local, não é usado no deploy).
3. Configure as variáveis de ambiente do projeto na Vercel:
   - `DATABASE_URL`: a connection string do passo 1
   - `SESSION_SECRET`: uma string aleatória de 32+ caracteres (gere com `openssl rand -hex 32`) — nunca reaproveite a de dev
4. Deploy automático a cada push no branch principal.
5. **Migrations não rodam sozinhas no deploy** (de propósito, para não acoplar todo deploy a uma migração de banco). Depois de criar/alterar tabelas, rode manualmente apontando para o banco de produção:
   ```bash
   DATABASE_URL="<connection string de produção>" npm run migrate:up
   ```
6. Crie o primeiro Organizador em produção do mesmo jeito, apontando `DATABASE_URL` para o banco de produção:
   ```bash
   DATABASE_URL="<connection string de produção>" \
   ORGANIZADOR_NOME="Seu Nome" ORGANIZADOR_TELEFONE="11999998888" \
   npm run seed:organizador
   ```

## Testes e checagem de tipos

```bash
npm run lint
npx tsc --noEmit
npm test               # testes unitários (rápidos, sem dependências externas)
npm run test:integration   # precisa de Postgres — ver test/integration/README.md
```
