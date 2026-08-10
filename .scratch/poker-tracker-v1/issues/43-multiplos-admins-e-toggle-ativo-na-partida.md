# 43 — Múltiplos Organizadores + ativar/desativar Jogador direto da Partida

**What to build:** Organizador pediu três coisas: (1) ativar/desativar um Jogador direto da tela de Partida (perguntou modal vs. redirecionar pro CRUD), (2) permitir promover/remover outros Jogadores como Organizador, (3) confirmar se "trocar senha" funciona e usar máscara `(99) 99999-9999` no telefone.

**Blocked by:** 41 (spinners/feedback), 29 (reskin Jogadores)

**Status:** done

- [x] **Trocar senha** — testado ponta a ponta (login → trocar senha → logout → login com a nova senha → confere): funciona corretamente, não era bug
- [x] **Máscara de telefone**: `formatarTelefone` (`src/lib/auth/telefone.ts`) formata como `(99) 99999-9999` enquanto digita — aplicado no login e no novo fluxo de promoção a Organizador. Cosmético só: o back-end sempre normaliza pra dígitos puros de qualquer forma (`normalizarTelefone`)
- [x] **Ativar/desativar Jogador da Partida — modal** (recomendação aceita): `ModalGerenciarJogadores` (novo componente compartilhado) — busca `GET /api/jogadores` (todos, ativos e inativos) só quando abre, mesmo toggle otimista do CRUD (ticket 41). Acessível via "Gerenciar" tanto em Nova Partida quanto na Partida em andamento; ao ativar/desativar, a lista de "Jogador já cadastrado" atualiza na hora sem precisar fechar o modal
- [x] **Múltiplos Organizadores**:
  - `src/lib/jogadores.ts`: `definirOrganizadorDoJogador(id, ehOrganizador, telefone?)` — promover exige telefone (o que o Jogador já tiver, ou passado na chamada); senha inicial os 4 últimos dígitos, mesmo padrão manual do `seed-organizador.ts`. Rebaixar **invalida a senha** (`senha_hash = NULL`), não só desmarca — sem isso a senha antiga continuaria funcionando se alguém promovesse essa pessoa de novo sem definir senha nova
  - Trava (confirmada com o Organizador antes de implementar): nunca deixa remover o último Organizador restante — `UltimoOrganizadorNaoPodeSerRemovidoError`, checada dentro de uma transação com `FOR UPDATE` na linha do Jogador
  - `TelefoneJaCadastradoError` se o telefone já for de outro Jogador (constraint `UNIQUE` já existia)
  - UI em `/jogadores`: estrela clicável por Jogador (promove/rebaixa) — sem telefone cadastrado, abre um formulário inline pedindo telefone (com a máscara) em vez de um `prompt()` do navegador; com telefone já cadastrado ou pra rebaixar, confirma com `confirm()` (mesmo padrão já usado em outras ações irreversíveis do app, ex: Encerrar Temporada)
- [x] `CONTEXT.md` atualizado — Organizador agora documenta que pode haver mais de um, como promover/rebaixar, e a trava do último restante
- [x] Verificado ponta a ponta via chamadas HTTP reais (não só a UI): promover sem telefone → recusado; promover com telefone → senha bate com os 4 últimos dígitos, login funciona; rebaixar um Organizador (não o último) → sucesso, senha antiga para de funcionar; tentar rebaixar o último Organizador restante → recusado com a mensagem certa
- [x] `npm test` (50/50), `npm run test:integration` (83/83, 5 novos casos pro promote/demote — sem regressão), lint e `tsc --noEmit` limpos

**Nota:** a trava "não deixa remover o último Organizador" não tem teste de integração automatizado — exigiria mexer no Organizador real já seedado (derrubar a contagem global até 1), arriscado demais num banco compartilhado com o resto do dev local. Verificada manualmente contra a API de verdade (ver acima).
