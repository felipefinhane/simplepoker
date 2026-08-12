/**
 * Formatação de mensagem + link `wa.me` pra exportar o Ranking (geral ou
 * de uma Partida) pro WhatsApp — ticket 51. Sem envio automático: o link
 * abre o WhatsApp (app no celular, Web no desktop) com o texto pronto, o
 * usuário escolhe pra quem/qual grupo manda. Formatação Markdown do
 * próprio WhatsApp (`*negrito*`, `_itálico_`), não HTML/Markdown comum.
 */

/**
 * Só texto puro (`1º`, `2º`...), nunca emoji de medalha — dentro da tabela
 * monoespaçada (ver `montarTabela`) um emoji desalinharia as colunas
 * (largura variável mesmo em fonte monoespaçada). A medalha do 1º lugar
 * aparece à parte, na linha de destaque acima da tabela.
 */
function formatarPosicao(indice: number): string {
  return `${indice + 1}º`;
}

interface ColunaDeTabela {
  titulo: string;
  alinhamento?: "esquerda" | "direita";
}

/**
 * "Tabela" de verdade só funciona em WhatsApp dentro de um bloco
 * monoespaçado (` ``` `) — é a única fonte de largura fixa que o app
 * respeita; fora disso (negrito/itálico normais) cada caractere tem uma
 * largura diferente e nenhum espaçamento alinha corretamente. Por isso
 * emoji (largura variável mesmo em fonte monoespaçada) não entram aqui —
 * só texto puro.
 */
function montarTabela(colunas: ColunaDeTabela[], linhas: string[][]): string {
  const larguras = colunas.map((coluna, indice) =>
    Math.max(coluna.titulo.length, ...linhas.map((linha) => linha[indice].length)),
  );

  function formatarLinha(celulas: string[]): string {
    return celulas
      .map((celula, indice) =>
        colunas[indice].alinhamento === "direita"
          ? celula.padStart(larguras[indice])
          : celula.padEnd(larguras[indice]),
      )
      .join("  ")
      .trimEnd();
  }

  // Hífen simples, não "─" (box drawing) — garantidamente largura fixa em
  // qualquer fonte monoespaçada; caractere de desenho de caixa às vezes
  // não é, dependendo da fonte do telefone de quem recebe.
  const separador = larguras.map((largura) => "-".repeat(largura)).join("--");

  return [
    "```",
    formatarLinha(colunas.map((coluna) => coluna.titulo)),
    separador,
    ...linhas.map(formatarLinha),
    "```",
  ].join("\n");
}

export interface LinhaDeRankingParaExportar {
  nome: string;
  totalPontos: number;
  totalAlmas: number;
}

/** Ranking de Pontuação completo da Temporada, como tabela (bloco monoespaçado), do 1º ao último. */
export function formatarMensagemRankingGeral(
  ranking: LinhaDeRankingParaExportar[],
  temporadaDesde: string,
): string {
  const lider = ranking[0];

  const tabela = montarTabela(
    [
      { titulo: "Pos" },
      { titulo: "Jogador" },
      { titulo: "Pts", alinhamento: "direita" },
      { titulo: "Almas", alinhamento: "direita" },
    ],
    ranking.map((entrada, indice) => [
      formatarPosicao(indice),
      entrada.nome,
      String(entrada.totalPontos),
      String(entrada.totalAlmas),
    ]),
  );

  return [
    `🏆 *Ranking da Temporada* (desde ${temporadaDesde})`,
    ...(lider ? [`🥇 Líder: *${lider.nome}*`] : []),
    "",
    tabela,
    "",
    "_Poker dos Amigos_",
  ].join("\n");
}

export interface LinhaDePartidaParaExportar {
  nome: string;
  posicao: number | null;
  pontos: number | null;
  /** Null pra quem guardou a própria Alma (1º/2º) ou pra quem o dado não foi registrado — ver CONTEXT.md. */
  eliminadoPorNome: string | null;
}

/** Resultado de uma Partida finalizada, como tabela (bloco monoespaçado) — ignora quem, por algum motivo, ficou sem Posição. */
export function formatarMensagemResultadoPartida(
  data: string,
  lancamentos: LinhaDePartidaParaExportar[],
): string {
  const ordenados = [...lancamentos]
    .filter((l): l is LinhaDePartidaParaExportar & { posicao: number } => l.posicao !== null)
    .sort((a, b) => a.posicao - b.posicao);

  const campeao = ordenados[0];

  const tabela = montarTabela(
    [
      { titulo: "Pos" },
      { titulo: "Jogador" },
      { titulo: "Pts", alinhamento: "direita" },
      { titulo: "Eliminado por" },
    ],
    ordenados.map((l, indice) => [
      formatarPosicao(indice),
      l.nome,
      String(l.pontos ?? "—"),
      l.eliminadoPorNome ?? "—",
    ]),
  );

  return [
    `🃏 *Resultado da Partida — ${data}*`,
    ...(campeao ? [`🏆 Vitória de *${campeao.nome}*!`] : []),
    "",
    tabela,
    "",
    "_Poker dos Amigos_",
  ].join("\n");
}

// Acima disso, alguns clientes (principalmente o deep link do app no
// celular, diferente do WhatsApp Web) começam a truncar ou simplesmente
// falhar em abrir com o texto pré-preenchido — não é um limite documentado
// oficialmente, só uma margem seguidamente segura na prática. Ranking de
// um grupo de amigos (algumas dezenas de linhas no máximo) fica bem longe
// disso; o corte aqui é só uma rede de segurança, não o caminho esperado.
const LIMITE_SEGURO_DE_CARACTERES = 1800;

/** Monta a URL `wa.me` com o texto pronto — sem destinatário fixo, o usuário escolhe no próprio WhatsApp. */
export function linkDoWhatsapp(mensagem: string): string {
  const texto =
    mensagem.length > LIMITE_SEGURO_DE_CARACTERES
      ? `${mensagem.slice(0, LIMITE_SEGURO_DE_CARACTERES - 1)}…`
      : mensagem;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
