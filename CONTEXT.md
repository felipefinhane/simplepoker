# Simplepoker

Webapp para gerenciar o campeonato de poker semanal de um grupo de amigos: registrar o resultado de cada partida, calcular rankings da temporada e controlar o fundo comum do grupo.

## Language

**Jogador**:
Uma pessoa que participa do campeonato. Todo jogador aparece no ranking; nem todo jogador tem login no sistema (ver **Organizador**). Um Jogador pode ser desativado pelo Organizador — some das listas de participantes de novas Partidas, mas seu histórico (Partidas, Pontos, Almas já registrados) continua intacto. Um Organizador não pode ser desativado (a semântica de desativar quem tem login ainda não foi definida).
_Avoid_: Participante, usuário (usuário é reservado para quem tem conta/login)

**Organizador**:
Um jogador com permissão para criar partidas, lançar classificação, cadastrar novos jogadores e gerenciar o caixa. É o único papel com login no sistema na v1 — os demais jogadores não autenticam. Pode haver mais de um Organizador ao mesmo tempo: qualquer Organizador pode promover outro Jogador (definindo telefone, se ele ainda não tiver um — a senha inicial é sempre os 4 últimos dígitos do telefone) ou remover o status de outro Organizador (invalida a senha dele na hora). Sempre precisa sobrar pelo menos um Organizador — a última promoção não pode ser removida.
_Avoid_: Admin, administrador (usar "Organizador" como termo canônico do domínio; "admin" pode aparecer só como detalhe técnico de implementação)

**Temporada**:
Um campeonato semestral, formado por várias Partidas semanais, com pontuação por **pontos corridos** — os pontos de cada Partida se somam ao longo da Temporada, sem eliminação de jogadores entre partidas. Tem seu próprio Ranking de Pontuação, Ranking Carrasco e Caixa, que não se misturam com os de outras Temporadas. Temporadas passadas ficam guardadas para consulta histórica.
_Avoid_: Campeonato (usar Temporada para a unidade que se repete a cada semestre)

**Partida**:
Um encontro semanal do grupo, jogado numa mesa (ou mais, se necessário — o sistema não distingue mesas). Requer no mínimo 5 participantes para existir (validado pelo sistema). Gera, para cada Jogador participante: Posição final, Eliminador (de onde vem a Alma) e Pagamento. Data e quantidade de participantes são atributos da Partida.

Uma Partida está **em andamento** desde que é criada: data e participantes continuam editáveis, e os Lançamentos podem ser preenchidos aos poucos, conforme os participantes vão saindo (ver Eliminou), sem precisar preencher todo mundo de uma vez. O Organizador a **finaliza** quando resta no máximo um participante sem Posição (o campeão, que vira 1º automaticamente) — finalizar calcula a Premiação da Partida e a entrada no Caixa, e trava a Partida contra novas edições (ela só entra no Ranking depois disso).
_Avoid_: Jogo, sessão

**Posição**:
O lugar em que um Jogador terminou uma Partida (1º, 2º, 3º...). Determina os Pontos daquele jogador na partida via a Tabela de Pontos.

**Lançamento**:
O registro de Posição e de quem Eliminou o Jogador (quando aplicável) que o Organizador lança para um Jogador numa Partida — é a partir dele que se derivam as Almas e os Pontos daquele Jogador naquela Partida.

**Eliminou** (relação entre Jogadores num Lançamento):
Cada Jogador que termina do 3º lugar pra baixo numa Partida foi eliminado por outro Jogador ainda ativo naquele momento — essa relação é registrada diretamente (quem eliminou quem), não como um número solto. O 1º e o 2º colocado não têm Eliminador: a Partida termina com os dois de pé, sem um confronto final. Se o Organizador não souber/lembrar quem eliminou alguém, o campo fica em branco — aquela Alma simplesmente não é contada pra ninguém.

**Alma**:
Cada Jogador começa uma Partida com 1 alma (a própria). Ao ser eliminado, entrega **só a própria alma** pra quem o Eliminou — qualquer alma que já tivesse coletado de outros Jogadores (por eliminações que ele mesmo fez antes de sair) fica com ele, contando nos pontos dele mesmo, mesmo já tendo saído da Partida. O 1º e o 2º colocado nunca são eliminados, então guardam a própria alma também. Na prática, sem precisar reconstruir cadeia nenhuma: **Almas de um Jogador numa Partida = quantos Jogadores ele eliminou nessa Partida + 1 se ele terminou em 1º ou 2º lugar**. Cada Alma vale 1 ponto extra na pontuação da partida (ver Pontos).
_Avoid_: Eliminação, kill, bounty

**Pontos (da Partida)**:
Pontos(Posição) + 1 × Almas. Pontos(Posição) vem da Tabela de Pontos, fixa para toda Partida independente de quantos jogadores participaram.

**Parâmetros da Temporada**:
Conjunto de configurações definidas quando uma Temporada é criada e congeladas durante toda a sua duração (não mudam entre Partidas da mesma Temporada, só de uma Temporada para a próxima): Tabela de Pontos, Valor da Partida, multiplicadores da Premiação da Partida, Estrutura de Blinds e Fichas Iniciais. Ao criar uma nova Temporada, o Organizador parte dos valores da Temporada anterior como padrão e pode alterá-los.

**Tabela de Pontos**:
Mapeamento de Posição → pontos, parte dos Parâmetros da Temporada (1º=25, 2º=18, 3º=15, 4º=12, 5º=10, 6º=8, 7º=6, 8º=4, 9º=2, 10º–15º=1, sem posição=0 são os valores padrão, vindos da planilha atual).

**Estrutura de Blinds**:
Sequência de níveis (small/big blind + duração) usada no Timer da Partida, parte dos Parâmetros da Temporada — igual para toda Partida daquela Temporada.

**Timer**:
Cronômetro sincronizado dos níveis de blind de uma Partida (um por Partida), controlado pelo Organizador e visível por qualquer um. Roda ou está parado num nível da Estrutura de Blinds daquela Temporada. O Organizador pode iniciar/retomar, pausar, pular ou voltar de nível (livremente entre o primeiro e o último), reiniciar (zera pro primeiro nível com o tempo cheio, mas continua controlável) ou encerrar (zera e **trava**: nenhum desses controles funciona mais depois — sem volta, igual a finalizar uma Partida ou encerrar uma Temporada).

**Fichas Iniciais**:
Quantidade e composição de fichas com que cada Jogador começa uma Partida, parte dos Parâmetros da Temporada.

**Ranking de Pontuação**:
Classificação geral da Temporada, ordenando os Jogadores pela soma dos Pontos de todas as Partidas jogadas até o momento. Empate em Pontos desempata por mais Almas; empate total cai para ordem alfabética do Jogador.

**Ranking Carrasco**:
Classificação paralela da Temporada, ordenando os Jogadores pela soma das Almas (eliminações) — não pela pontuação. Responde "quem mais eliminou gente". Empate em Almas desempata por mais Pontos; empate total cai para ordem alfabética do Jogador.

**Pagamento**:
Registro por Jogador, por Partida, indicando se ele pagou o Valor da Partida naquela noite. É só um controle informativo (quem ainda deve) — não afeta o cálculo automático do Caixa, que assume sempre `QTDE × Valor da Partida`.
_Avoid_: PGTO

**Valor da Partida**:
Parte dos Parâmetros da Temporada (padrão: R$10) — quanto cada participante contribui numa Partida. Base para o cálculo da entrada no Caixa e da Premiação da Partida.

**Premiação da Partida**:
Valor pago ao 1º e 2º colocados de cada Partida, calculado como múltiplos do Valor da Partida definidos nos Parâmetros da Temporada (padrão: 1º = 2×, 2º = 1×). Sai do total arrecadado daquela Partida antes de entrar no Caixa.

**Caixa**:
Fundo comum, escopado por Temporada (não atravessa temporadas — cada Temporada tem o seu). Cada Partida gera uma entrada automática igual a `(QTDE × Valor da Partida) − Premiação da Partida`. Saídas são lançadas manualmente pelo Organizador (ex: compra de baralho, prêmios de fim de Temporada, confraternização), com data, descrição e valor.
_Avoid_: Fundo, caixinha
