# 31 — Seed automático no `docker compose up` (pra testar Nova Partida local)

**What to build:** Organizador queria testar a criação de Partida localmente, mas isso exige cadastrar o Organizador, um punhado de Jogadores e ter uma Temporada aberta antes de sequer chegar em "Nova Partida" — hoje isso é manual (`seed:organizador` + cadastrar cada Jogador pela UI + criar a Temporada). Pedido: um script de carga de dados parecido com produção, que já roda sozinho quando sobe o `docker compose up`.

**Blocked by:** Nenhum — infraestrutura de dev, não depende de nenhum ticket anterior.

**Status:** done

- [x] `scripts/seed-dev.ts`: cria o Organizador de teste (`11999998888`/senha `8888`, ou `ORGANIZADOR_NOME`/`ORGANIZADOR_TELEFONE` se informados), cadastra os 14 nomes do elenco real (mesmos das Temporadas importadas nos tickets 24/27/28 — só os nomes, nenhum dado de produção de verdade) e cria uma Temporada aberta com os Parâmetros padrão (`obterParametrosPadraoParaNovaTemporada`, reaproveitado — os mesmos valores que já pré-preenchem o formulário de Nova Temporada na UI)
- [x] **Idempotente**: só faz alguma coisa se o banco ainda não tiver nenhum Jogador — roda de novo em todo `docker compose up` sem risco de duplicar nada ou pisar em cima de dados que você já criou brincando com o app
- [x] `docker-compose.yml`: `command` do serviço `app` passou a rodar `npm run seed:dev` depois das migrations e antes do `next dev`
- [x] `package.json`: novo script `seed:dev`; script `dev` trocado pra `next dev --webpack`
- [x] **Bug de ambiente real, achado testando isso** (não é do app): depois de um `docker compose down -v` (recriando o volume `node_modules` do zero), o `npm ci` dentro do container Alpine (musl) às vezes resolve o binário nativo `@next/swc-linux-x64-**gnu**` (glibc) em vez do `-musl` certo pra essa base de imagem — o Next então tenta cair pro fallback WASM, que funciona pra tudo, exceto o Turbopack (que exige binding nativo, recusa WASM). Resultado: `docker compose up` derrubava o container assim que o dev server subia, com `Error: Turbopack is not supported on this platform`. Corrigido forçando Webpack (`next dev --webpack`) — mais lento que Turbopack, mas não depende da resolução do binário nativo certo pra plataforma, então não fica vulnerável a essa flakiness de novo. Não achei o mesmo erro num `docker compose up` anterior nesta mesma sessão (mesmo Dockerfile) — parece ser inconsistência do `npm ci`/registry, não algo determinístico
- [x] Verificado ponta a ponta: `docker compose down -v` + `docker compose up -d` do zero → seed roda sozinho (Organizador + 14 Jogadores + Temporada aberta) → login funciona → `/partidas/nova` mostra o elenco populado (screenshot) → `POST /api/partidas` cria uma Partida de verdade com sucesso. Rodado de novo em seguida pra confirmar a idempotência (log: "Banco já tem 15 Jogador(es) cadastrado(s) — nada a fazer")
- [x] README atualizado (seção "Rodando localmente" e "Criando o primeiro Organizador") pra descrever o novo comportamento
- [x] `npm test` (50/50), lint e `tsc --noEmit` limpos

**Nota:** mudança só afeta ambiente local (`docker-compose.yml`, `next dev`) — não toca no build de produção (`next build`/`next start`, usados pela Vercel), então não tem risco nenhum pro deploy.
