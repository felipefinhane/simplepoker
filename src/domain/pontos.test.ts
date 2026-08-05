import { describe, expect, it } from "vitest";
import { tabelaDePontosPadrao } from "./tabela-de-pontos";
import { calcularPontosDoLancamento } from "./pontos";

// Tabela de pontos real, informada pelo Organizador (PARAMETROS da planilha
// POKER 1_2026.xlsx): posição -> pontos.
describe("calcularPontosDoLancamento", () => {
  it.each([
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
  ])("posição %i sem almas vale %i pontos", (posicao, pontosEsperados) => {
    const pontos = calcularPontosDoLancamento(
      { posicao, almas: 0 },
      tabelaDePontosPadrao,
    );

    expect(pontos).toBe(pontosEsperados);
  });

  it("uma posição fora da tabela (16º em diante) vale 0 pontos de posição", () => {
    const pontos = calcularPontosDoLancamento(
      { posicao: 16, almas: 0 },
      tabelaDePontosPadrao,
    );

    expect(pontos).toBe(0);
  });

  it("cada alma soma 1 ponto extra aos pontos da posição", () => {
    const pontos = calcularPontosDoLancamento(
      { posicao: 3, almas: 4 },
      tabelaDePontosPadrao,
    );

    // 3º lugar = 15 pontos + 4 almas = 19
    expect(pontos).toBe(19);
  });
});
