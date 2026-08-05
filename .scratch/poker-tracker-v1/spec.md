# Simplepoker — Tracker de Campeonato (v1)

Status: ready-for-agent

## Problem Statement

Um grupo de amigos se reúne toda semana para jogar poker, disputando um campeonato semestral por pontos corridos. Hoje tudo é controlado numa planilha (`POKER 1_2026.xlsx`): resultado de cada Partida, ranking da Temporada, quem eliminou quem, quem pagou, e o saldo do fundo comum do grupo. Isso funciona, mas exige que alguém abra e edite manualmente uma planilha complexa toda semana, não tem visualização fácil pelo celular, não sincroniza um cronômetro de blinds durante o jogo, e não deixa claro pros outros jogadores (sem acesso à planilha) como está o ranking.

## Solution

Um webapp instalável (PWA) que substitui a planilha: qualquer pessoa acessa o Ranking de Pontuação e o Ranking Carrasco da Temporada atual sem precisar de login, pelo computador ou celular. Um Organizador autenticado cadastra Jogadores, cria Partidas, lança o resultado (posição, eliminações, pagamento) de cada Jogador, e o sistema calcula automaticamente pontos, prêmios da partida e o saldo do Caixa. Durante o jogo, o Organizador roda um timer de blinds compartilhado que todos os participantes acompanham em tempo real no próprio aparelho.

## User Stories

1. Como visitante (sem login), quero ver o Ranking de Pontuação da Temporada atual, para acompanhar quem está na frente no campeonato.
2. Como visitante, quero ver o Ranking Carrasco da Temporada atual, para saber quem mais eliminou gente.
3. Como visitante, quero ver o histórico de Temporadas passadas e seus rankings finais, para relembrar campeonatos anteriores.
4. Como visitante, quero ver o detalhe de uma Partida específica (posição, almas e pontos de cada Jogador), para conferir como o resultado daquela noite foi apurado.
5. Como visitante, quero ver o extrato do Caixa da Temporada atual (entradas e saídas), para saber quanto o grupo tem guardado.
6. Como visitante no celular, quero poder "instalar" o site na tela inicial, para acessar como se fosse um app nativo.
7. Como Organizador, quero logar com meu número de celular e uma senha, para acessar as ações restritas.
8. Como Organizador, quero trocar minha senha inicial (os 4 últimos dígitos do meu celular) por uma de minha escolha, para manter minha conta segura.
9. Como Organizador, quero cadastrar um novo Jogador informando apenas o nome, para incluí-lo nas próximas Partidas.
10. Como Organizador, quero editar ou desativar um Jogador cadastrado, para corrigir um nome ou remover alguém que não joga mais.
11. Como Organizador, quero criar uma nova Temporada definindo seus Parâmetros (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida, Estrutura de Blinds, Fichas Iniciais), partindo dos valores da Temporada anterior (ou da planilha atual, na primeira vez) como padrão, para não ter que reconfigurar tudo do zero a cada semestre.
12. Como Organizador, quero editar os Parâmetros da Temporada enquanto ela ainda está aberta, para corrigir um valor antes de ele afetar alguma Partida.
13. Como Organizador, quero encerrar a Temporada atual, para congelar seu ranking final e liberar a criação de uma nova.
14. Como Organizador, quero criar uma nova Partida informando data e os Jogadores participantes, para depois lançar o resultado da noite.
15. Como Organizador, ao tentar criar uma Partida com menos de 5 participantes, quero que o sistema me impeça, para respeitar a regra mínima do grupo.
16. Como Organizador, quero lançar, para cada Jogador participante de uma Partida, sua Posição final e o número de Almas, para que o sistema calcule os Pontos daquele Jogador automaticamente (Pontos = pontos da Posição, pela Tabela de Pontos da Temporada, + 1 por Alma).
17. Como Organizador, quero que o sistema calcule automaticamente a Premiação da Partida (valor pago ao 1º e ao 2º colocados, como múltiplos do Valor da Partida definidos nos Parâmetros), para não ter que calcular isso na mão toda semana.
18. Como Organizador, quero que o sistema gere automaticamente a entrada no Caixa da Temporada ao lançar o resultado de uma Partida (arrecadado menos a Premiação da Partida), para manter o saldo sempre atualizado.
19. Como Organizador, quero marcar se cada Jogador pagou o Valor da Partida naquela noite, para saber quem ainda deve — sem que isso trave ou altere o cálculo automático do Caixa.
20. Como Organizador, quero editar um resultado já lançado (posição, almas ou pagamento de um Jogador numa Partida), para corrigir um erro de digitação.
21. Como Organizador, quero lançar uma saída manual do Caixa (data, descrição, valor — ex: compra de baralho, prêmio de fim de Temporada, confraternização), para registrar despesas do grupo.
22. Como Organizador, quero ver o extrato completo do Caixa da Temporada (entradas automáticas por Partida + saídas manuais), para conferir o saldo e o histórico.
23. Como Organizador, quero iniciar, pausar e pular nível do timer de blinds de uma Partida, usando a Estrutura de Blinds definida nos Parâmetros da Temporada, para conduzir o jogo sem precisar de um cronômetro físico.
24. Como participante de uma Partida (com o app aberto, logado ou não), quero ver o timer de blinds contando ao vivo, sincronizado com o que o Organizador está controlando, para saber em que nível estamos sem perguntar.
25. Como participante de uma Partida com o app aberto, quero receber um alerta visual/sonoro quando o nível de blind mudar, para não perder a hora de aumentar a aposta.

## Implementation Decisions

- **Stack**: Next.js (React) full-stack, um único projeto servindo API e frontend. PWA via web manifest + service worker, habilitando "instalar no celular".
- **Banco de dados**: Postgres gerenciado em camada gratuita (Supabase ou Neon).
- **Hospedagem**: camada gratuita (ex: Vercel).
- **Autenticação**: só existe para o papel Organizador (v1). Login = número de celular, senha inicial = 4 últimos dígitos do celular (hash armazenado, nunca em texto puro), com fluxo de troca de senha. Sessão simples via cookie — sem OAuth, sem SMS/OTP (evita custo). Jogadores comuns não autenticam nesta versão.
- **Modelo de dados** (conceitual, ver `CONTEXT.md` para a definição de cada termo):
  - `Temporada`: período, status (aberta/encerrada), Parâmetros da Temporada embutidos (Tabela de Pontos, Valor da Partida, multiplicadores de Premiação da Partida, Estrutura de Blinds, Fichas Iniciais). Só uma Temporada pode estar aberta por vez — abrir uma nova exige encerrar a anterior.
  - `Jogador`: nome; flag indicando se é Organizador; se for, telefone + senha (hash).
  - `Partida`: pertence a uma Temporada; data; conjunto de Jogadores participantes com, cada um, Posição, Almas e Pagamento.
  - `CaixaTransação`: pertence a uma Temporada; tipo (entrada automática vinculada a uma Partida, ou saída manual); valor; data; descrição (para saídas manuais).
- **Cálculo derivado, não redundante**: Pontos da Partida, Ranking de Pontuação, Ranking Carrasco, Premiação da Partida e a entrada automática do Caixa são todos **calculados a partir de** Posição, Almas, quantidade de participantes e dos Parâmetros da Temporada — não armazenados como valores separados que podem divergir da fonte.
- **Timer**: estado (nível atual, instante de início do nível corrente, rodando/pausado) fica gravado no banco, associado à Partida. Clientes atualizam por polling leve (a cada poucos segundos) — sem WebSocket nesta versão, suficiente para o volume de uso. Só o Organizador controla start/pause/pular nível; qualquer cliente com o app aberto reflete o mesmo estado e dispara o alerta local quando o nível muda.
- **Validação de mínimo de participantes**: o sistema rejeita a criação de uma Partida com menos de 5 Jogadores.

## Testing Decisions

- Projeto greenfield — não há testes existentes para servir de referência; esta é a primeira convenção de teste do projeto.
- **Seam de teste**: a camada de funções de domínio/serviço (cálculo de pontos, rankings, premiação da partida, entrada automática no caixa, validações, transições do timer), testada diretamente — sem precisar subir banco real, HTTP ou UI.
- Um bom teste aqui verifica **comportamento observável** (dado um conjunto de Posições/Almas/Parâmetros, qual o Ranking ou saldo de Caixa resultante) — não como a função está implementada por dentro.
- Casos a cobrir: cálculo de Pontos (posição + almas); ordenação do Ranking de Pontuação e do Ranking Carrasco, incluindo empates; cálculo da Premiação da Partida e da entrada automática no Caixa; rejeição de Partida com menos de 5 participantes; ações restritas (criar Partida, lançar resultado, editar Parâmetros, lançar saída do Caixa) só permitidas a um Organizador autenticado; transições do timer (start/pause/pular nível avançando pela Estrutura de Blinds).
- Os resultados já apurados manualmente em `POKER 1_2026.xlsx` (posições, almas, pontos e rankings de partidas reais) servem de fixtures de regressão para os testes de cálculo de Pontos e Rankings — ver Further Notes.

## Out of Scope

- Login individual para Jogadores comuns (v2).
- Notificação push com o app fechado (v2) — v1 só alerta quem está com o app aberto.
- Qualquer distinção entre múltiplas mesas dentro de uma mesma Partida — o sistema trata cada Partida como uma unidade única, independente de quantas mesas físicas existiram naquela noite.
- Cálculo automático de premiação de fim de Temporada — fica coberto pelas saídas manuais do Caixa (o Organizador lança o valor pago como uma saída, igual à compra de baralho).
- Suporte a mais de uma Temporada aberta simultaneamente.
- Campo separado de apelido/nome civil — só existe um campo Nome por Jogador.
- Qualquer meio de pagamento online (PIX, cartão) — Pagamento é apenas um registro manual (pago/não pago).

## Further Notes

- **Sem migração de dados**: as Partidas já registradas em `POKER 1_2026.xlsx` não são importadas para o sistema novo — a primeira Temporada do sistema começa do zero. Os valores de Parâmetros da planilha atual (Tabela de Pontos, Valor da Partida = R$10, multiplicadores 2×/1×) servem de padrão/seed ao criar essa primeira Temporada.
- Os dados reais da planilha (posições, almas, pontos e rankings já apurados manualmente) devem ser usados como **fixtures de teste** unitários/integração — validar que o cálculo de Pontos, Ranking de Pontuação e Ranking Carrasco do sistema bate com os valores que a planilha já apurou manualmente é um ótimo caso de teste de regressão (comportamento conhecido e correto, vindo da fonte real).
- Ver `CONTEXT.md` (glossário) e `docs/adr/0001-timer-sincronizado-via-servidor.md` para o contexto completo das decisões de domínio que embasam este spec.
