/**
 * O que o Organizador lança para um Jogador numa Partida: sua Posição final
 * e o número de Almas (eliminações). Ver CONTEXT.md.
 */
export interface LancamentoDeResultado {
  posicao: number;
  almas: number;
}

/** Um Lancamento identificado por jogador, para agregação na Temporada. */
export interface LancamentoDoJogador extends LancamentoDeResultado {
  jogadorId: string;
}

/**
 * Parâmetros da Temporada (ver CONTEXT.md). Este ticket só precisa dos
 * campos usados pelo cálculo de Premiação da Partida e da entrada no
 * Caixa — Tabela de Pontos, Estrutura de Blinds e Fichas Iniciais entram
 * quando o ticket 05 persistir os Parâmetros completos; até lá, esta
 * interface cresce incrementalmente em vez de antecipar campos que ainda
 * não têm uso real.
 */
export interface ParametrosDaTemporada {
  valorDaPartida: number;
  multiplicadorPremiacaoPrimeiro: number;
  multiplicadorPremiacaoSegundo: number;
}
