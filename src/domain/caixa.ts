import type { ParametrosDePremiacao } from "./types";

/** Valor pago ao 1º e ao 2º colocados de uma Partida. Ver CONTEXT.md. */
export interface PremiacaoDaPartida {
  primeiro: number;
  segundo: number;
}

/**
 * Premiação da Partida = múltiplos do Valor da Partida, configurados nos
 * Parâmetros da Temporada.
 */
export function calcularPremiacaoDaPartida(
  parametros: ParametrosDePremiacao,
): PremiacaoDaPartida {
  return {
    primeiro:
      parametros.valorDaPartida * parametros.multiplicadorPremiacaoPrimeiro,
    segundo:
      parametros.valorDaPartida * parametros.multiplicadorPremiacaoSegundo,
  };
}

/**
 * Entrada automática no Caixa gerada por uma Partida = arrecadado
 * (quantidade de participantes x Valor da Partida) menos a Premiação da
 * Partida. Ver CONTEXT.md.
 */
export function calcularEntradaNoCaixa(
  quantidadeDeParticipantes: number,
  parametros: ParametrosDePremiacao,
): number {
  const arrecadado = quantidadeDeParticipantes * parametros.valorDaPartida;
  const premiacao = calcularPremiacaoDaPartida(parametros);

  return arrecadado - premiacao.primeiro - premiacao.segundo;
}
