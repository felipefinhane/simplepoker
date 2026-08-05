# 01 — Scaffold do projeto

**What to build:** Um projeto Next.js publicado e acessível por URL, conectado a um banco Postgres gerenciado em camada gratuita (ex: Supabase ou Neon), hospedado em camada gratuita (ex: Vercel), e instalável como PWA no celular (manifest + service worker mínimos). O conteúdo pode ser só uma página placeholder — o objetivo é ter a espinha dorsal no ar antes de qualquer feature de domínio. Localmente, o projeto roda inteiro via Docker Compose (app + Postgres em containers separados), sem exigir Node.js nem Postgres instalados na máquina de quem for desenvolver.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] App acessível publicamente por uma URL, sem custo de hospedagem — https://simplepoker-xpxb.vercel.app/ (Vercel + Neon, ambos free tier)
- [x] Conexão com o banco Postgres funcionando (health-check simples) — `GET /api/health`
- [x] Manifest + service worker configurados; navegador oferece a opção de "instalar" o app no celular
- [x] `docker-compose up` sobe o app Next.js e um Postgres (imagem oficial `postgres`) em containers separados, com o app acessível localmente e já conectado ao banco
- [x] Documentado como rodar o projeto localmente via Docker e como fazer deploy (README.md)
