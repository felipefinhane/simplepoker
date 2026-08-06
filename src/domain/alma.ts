/**
 * Almas de um Jogador numa Partida = quantos Jogadores ele eliminou nessa
 * Partida + 1 se ele terminou em 1º ou 2º lugar (guardou a própria alma
 * até o fim, já que nunca é eliminado). Ver CONTEXT.md — Alma.
 *
 * Única fonte de verdade da fórmula — reaproveitada tanto por
 * `buscarPartidaPorId` (uma Partida) quanto por `calcularRankingsDaTemporada`
 * (agregado de várias), que só precisam contar quantos eliminados cada um
 * teve e checar a Posição.
 */
export function calcularAlmas(
  quantidadeEliminados: number,
  posicao: number | null,
): number {
  const guardouAPropriaAlma = posicao === 1 || posicao === 2;
  return quantidadeEliminados + (guardouAPropriaAlma ? 1 : 0);
}
