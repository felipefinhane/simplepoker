# Prompt pro Google Stitch — redesign mobile-first do Simplepoker

> Cole o texto abaixo (a partir de "## Contexto") direto no Stitch. Ele descreve o produto real, já com todos os fluxos implementados — não é um produto hipotético.

## Contexto

Simplepoker é um webapp (PWA instalável) que um grupo de amigos usa pra tocar o campeonato de poker semanal deles: cada rodada é uma "Partida", os pontos das Partidas se acumulam numa "Temporada" (um semestre), e tem um "Caixa" (fundo comum) alimentado automaticamente pelo resultado de cada Partida. É usado majoritariamente no celular, na mesa, durante o jogo — geralmente com pouca luz e todo mundo com uma cerveja do lado. Precisa ser rápido de bater o olho e usar com uma mão só.

Existe um único papel com login: o "Organizador" (quem cria as Partidas, cadastra jogadores, mexe no Caixa e controla o timer). Todo mundo mais só visualiza, sem conta — é tudo público, sem paywall nem privacidade entre os participantes.

**Nome do app**: Simplepoker. **Cor de marca**: verde de feltro de mesa de poker, `#0f5132`, usada hoje como cor de tema da PWA. Sinta-se livre pra propor uma paleta em volta dela (dourado/âmbar pra acentos combina com o tema "fichas e cartas"), mas mantenha esse verde como âncora.

**Problema principal a resolver**: o app funciona mas está com uma tela por trás da outra, sem nenhuma navegação nem hierarquia visual — parece uma lista de formulários HTML puro (porque é literalmente isso hoje). Preciso de: (1) uma navegação mobile clara e persistente, (2) hierarquia visual (o que é a informação principal de cada tela vs. o que é secundário/ação), e (3) uma linguagem visual de "mesa de poker" consistente, sem virar cassino piscante — o público é um grupo de amigos, não high rollers.

## Estrutura de navegação

Barra de navegação inferior fixa (bottom tab bar), sempre visível, com no máximo 4-5 itens grandes o bastante pro polegar:

- **Ranking** (ícone de troféu/coroa) — tela inicial, pública
- **Partidas** (ícone de cartas) — pública
- **Caixa** (ícone de cifrão/carteira) — pública
- **Histórico** (ícone de relógio/calendário) — pública
- Um ícone de perfil/organizador no canto (topo ou como 5º item) que leva pro Login quando ninguém está autenticado, ou revela um menu com "Jogadores", "Temporada", "Trocar senha" e "Sair" quando o Organizador está logado.

Um cabeçalho superior simples com o nome "Simplepoker" (ou um monograma/logo) deve aparecer no topo de toda tela.

## Telas a desenhar

Gere cada uma como uma tela mobile completa (largura de celular, ~390px), com estado real preenchido com dados de exemplo plausíveis (nomes de pessoas, valores em R$, datas), não placeholders genéricos tipo "Lorem".

### 1. Ranking (Home) — pública
A tela mais vista do app. Mostra, pra Temporada em andamento:
- **Ranking de Pontuação**: lista ordenada de jogadores com posição, nome, total de Pontos (destaque) e total de Almas (secundário) — pense em cards empilhados ou uma tabela bem espaçada, com o 1º lugar visualmente destacado (coroa/medalha).
- **Ranking Carrasco**: uma segunda lista, ordenada por Almas — "quem mais eliminou gente". Mostra só posição, nome e Almas (**sem coluna de Pontos** — é um ranking à parte). Pode ter um tom mais "sangrento"/divertido (ícone de caveira ou machado, é o "carrasco" do grupo).
- Uma lista compacta abaixo com as últimas Partidas jogadas (data, tocando pra ver detalhe).
- Estado vazio: "Nenhuma Temporada aberta no momento" quando não há campeonato rolando.

### 2. Partida — detalhe (somente leitura) — pública
Quando um visitante abre uma Partida já finalizada: cabeçalho com a data, uma tabela/lista de participantes mostrando Posição, Eliminado por (quem tirou aquele jogador), Almas e Pontos de cada um — o 1º e 2º lugar em destaque (são os premiados). Se a Partida ainda estiver em andamento, mostra um badge "Em andamento" e o Timer de blinds em modo só-leitura (ver tela 6).

### 3. Partida — em andamento (modo Organizador)
A tela mais complexa e mais usada durante o jogo — o Organizador monta e conduz a Partida por aqui, ao vivo, na mesa. Precisa ficar clara mesmo com pressa:
- Campo pra editar a data da Partida.
- O Timer de blinds no topo, grande e controlável (ver tela 6).
- Uma lista de participantes (cards, não tabela — cada jogador é uma linha/card compacta) mostrando: nome, Posição (input numérico, vazio = ainda ativo), quem o eliminou (seletor), se pagou (toggle/checkbox), Almas e Pontos calculados.
- Cada participante **ainda ativo** (sem posição) tem um botão **"Saiu"** que abre um seletor rápido "Quem eliminou?" (só lista quem ainda está ativo) e confirma — a posição é atribuída sozinha por trás.
- Duas ações de adicionar gente à Partida: (a) selecionar um jogador já cadastrado que ainda não está na Partida, (b) cadastrar um jogador novo na hora e já adicionar — ambas relevantes porque as vezes chega gente atrasado.
- Um botão grande e destacado **"Finalizar Partida"**, desabilitado até sobrar no máximo 1 participante sem posição (o campeão). Ao finalizar, mostra a Premiação calculada (quanto o 1º e o 2º ganham). Peça confirmação antes (é uma ação que trava a Partida pra sempre).

### 4. Nova Partida
Formulário simples: campo de data + uma lista com checkbox de todos os jogadores ativos do grupo pra selecionar quem vai jogar (mínimo 5 marcados pra poder criar — mostre esse aviso).

### 5. Lista de Partidas (Organizador)
Lista de todas as Partidas (passadas e em andamento), cada uma mostrando data, quantidade de participantes e um badge "Em andamento" nas que ainda não foram finalizadas. Botão flutuante ou destacado "+ Nova Partida".

### 6. Timer de blinds
Um card (ou tela cheia, pensando em deixar o celular apoiado na mesa como "relógio de torneio") com: nível atual (ex: "Nível 3 de 13"), valor do blind pequeno/grande em fonte enorme, contagem regressiva enorme (mm:ss), e o próximo nível pequeno abaixo. Quando o nível muda, um destaque visual forte (borda colorida/flash) — hoje já toca um beep, então pense em algo que combine com esse alerta sonoro. Controles do Organizador (ícones grandes, fácil de acertar com o polegar): Iniciar/Pausar, Voltar nível, Pular nível, Reiniciar, Encerrar. Estado "Timer encerrado" (travado, sem nenhum controle disponível). Estado "sem Estrutura de Blinds configurada" (timer não pode ser usado).

### 7. Caixa
Saldo atual em destaque no topo (grande, em R$). Abaixo, um extrato tipo lista bancária: cada linha com data, descrição (entradas automáticas mostram "Entrada — resultado de Partida"; saídas manuais mostram a descrição digitada pelo Organizador, tipo "Compra de baralho") e valor (verde/positivo pra entrada, vermelho/negativo pra saída). Organizador logado vê um formulário/botão pra lançar uma saída manual (data, descrição, valor).

### 8. Histórico de Temporadas
Lista de Temporadas já encerradas (período: data início – data fim), tocando leva pro ranking final congelado daquela Temporada (reusa o layout da tela 1, mas sem nenhuma ação de edição, é só consulta histórica).

### 9. Jogadores (Organizador)
Lista de todos os jogadores do grupo (nome editável inline, com uma estrelinha marcando quem é Organizador). Cada jogador tem um toggle Ativo/Inativo (jogador inativo some da lista de seleção de novas Partidas, mas o histórico dele continua intacto — mostre isso meio "acinzentado" na lista, não removido). Formulário simples pra cadastrar um jogador novo.

### 10. Temporada / Parâmetros (Organizador)
Tela de configuração, menos usada mas precisa existir: Tabela de Pontos (posição → pontos, uma lista editável), Valor da Partida (quanto cada um paga por noite), multiplicadores de Premiação do 1º e 2º lugar, Estrutura de Blinds (lista editável de níveis: blind pequeno, blind grande, duração em minutos — parece uma tabela tipo planilha, pense em como isso fica confortável no mobile, talvez cards editáveis em vez de uma grade apertada), Fichas Iniciais (valor + quantidade de cada tipo de ficha). Botão "Encerrar Temporada" isolado e com confirmação forte (é irreversível).

### 11. Login
Tela simples e central: campo de celular, campo de senha, botão "Entrar". Sem cadastro público (só o Organizador tem conta, criada por fora do app).

## Componentes recorrentes a manter consistentes entre as telas

- **Card de jogador/linha de ranking**: avatar com iniciais (sem foto de perfil no sistema hoje), nome, um ou dois números em destaque à direita.
- **Badge de status**: "Em andamento" (Partida), "Encerrada" (Temporada/Timer) — cores distintas e consistentes.
- **Botão de ação primária** grande, full-width em mobile, pra ações como "Finalizar Partida", "Entrar", "Cadastrar".
- **Confirmação de ação irreversível** (finalizar Partida, encerrar Temporada, encerrar Timer) — hoje é um `confirm()` nativo do navegador; proponha algo mais bonito (modal/bottom sheet) mas que deixe claro que não tem volta.
- **Estado vazio** amigável (sem Partidas, sem Temporada aberta, sem movimentação no Caixa) — sempre com um texto curto explicando o que fazer a seguir, sem ficar preto e branco genérico demais.

## Fora do escopo (não desenhar)

- Qualquer relatório de "quem mais eliminou quem" além do Ranking Carrasco simples (fica pra uma versão futura do produto).
- Cadastro público de conta — só existe o login do Organizador.
- Multi-idioma — é só português do Brasil, sempre.
