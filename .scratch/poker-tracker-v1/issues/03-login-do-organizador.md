# 03 — Login do Organizador

**What to build:** Autenticação para o papel Organizador: login com número de celular e senha (senha inicial = 4 últimos dígitos do celular), fluxo de troca de senha, e sessão persistida (cookie). Nenhuma outra ação restrita do sistema funciona sem isso. Jogadores comuns não autenticam nesta versão (v2).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Organizador loga com celular + senha inicial (4 últimos dígitos do celular)
- [ ] Senha armazenada com hash, nunca em texto puro
- [ ] Organizador consegue trocar a senha
- [ ] Sessão persiste entre requisições (cookie)
- [ ] Tentativa de login com senha errada é rejeitada
- [ ] Rotas/ações restritas (a serem construídas nos próximos tickets) verificam que existe uma sessão de Organizador válida
