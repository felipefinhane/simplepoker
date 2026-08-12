/**
 * Formatação de mensagem + link `wa.me` pra exportar o Ranking (geral ou
 * de uma Partida) pro WhatsApp — ticket 51. Sem envio automático: o link
 * abre o WhatsApp (app no celular, Web no desktop) com o texto pronto, o
 * usuário escolhe pra quem/qual grupo manda. Formatação Markdown do
 * próprio WhatsApp (`*negrito*`, `_itálico_`), não HTML/Markdown comum.
 */

const MEDALHAS = ["🥇", "🥈", "🥉"];

function formatarPosicao(indice: number): string {
  return MEDALHAS[indice] ?? `${indice + 1}º`;
}

export interface LinhaDeRankingParaExportar {
  nome: string;
  totalPontos: number;
}

/** Ranking de Pontuação completo da Temporada, do 1º ao último. */
export function formatarMensagemRankingGeral(
  ranking: LinhaDeRankingParaExportar[],
  temporadaDesde: string,
): string {
  const linhas = ranking.map(
    (entrada, indice) => `${formatarPosicao(indice)} ${entrada.nome} — ${entrada.totalPontos} pts`,
  );

  return [
    `🏆 *Ranking da Temporada* (desde ${temporadaDesde})`,
    "",
    ...linhas,
    "",
    "_Poker dos Amigos_",
  ].join("\n");
}

export interface LinhaDePartidaParaExportar {
  nome: string;
  posicao: number | null;
  pontos: number | null;
}

/** Resultado de uma Partida finalizada — ignora quem, por algum motivo, ficou sem Posição. */
export function formatarMensagemResultadoPartida(
  data: string,
  lancamentos: LinhaDePartidaParaExportar[],
): string {
  const ordenados = [...lancamentos]
    .filter((l): l is LinhaDePartidaParaExportar & { posicao: number } => l.posicao !== null)
    .sort((a, b) => a.posicao - b.posicao);

  const linhas = ordenados.map(
    (l, indice) => `${formatarPosicao(indice)} ${l.nome} — ${l.pontos ?? "—"} pts`,
  );

  return [`🃏 *Resultado da Partida — ${data}*`, "", ...linhas, "", "_Poker dos Amigos_"].join("\n");
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
