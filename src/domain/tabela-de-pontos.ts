/**
 * Mapeamento de Posição -> pontos. Parte dos Parâmetros da Temporada
 * (ver CONTEXT.md). Posições fora da tabela valem 0.
 */
export type TabelaDePontos = ReadonlyMap<number, number>;

/**
 * Tabela de pontos padrão, vinda das PARAMETROS de POKER 1_2026.xlsx —
 * usada como valor inicial ao criar a primeira Temporada do sistema.
 */
export const tabelaDePontosPadrao: TabelaDePontos = new Map([
  [1, 25],
  [2, 18],
  [3, 15],
  [4, 12],
  [5, 10],
  [6, 8],
  [7, 6],
  [8, 4],
  [9, 2],
  [10, 1],
  [11, 1],
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
]);

/** Pontos da posição na Tabela de Pontos; 0 para qualquer posição não listada. */
export function pontosDaPosicao(
  tabela: TabelaDePontos,
  posicao: number,
): number {
  return tabela.get(posicao) ?? 0;
}
