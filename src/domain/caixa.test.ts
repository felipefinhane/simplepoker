import { describe, expect, it } from "vitest";
import {
  calcularEntradaNoCaixa,
  calcularPremiacaoDaPartida,
} from "./caixa";
import type { ParametrosDaTemporada } from "./types";

// Valores reais informados pelo Organizador: Valor da Partida R$10,
// Premiação = 2x para o 1º e 1x para o 2º colocado.
const parametrosReais: ParametrosDaTemporada = {
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
};

describe("calcularPremiacaoDaPartida", () => {
  it("calcula a premiação do 1º e 2º colocados como múltiplos do Valor da Partida", () => {
    const premiacao = calcularPremiacaoDaPartida(parametrosReais);

    expect(premiacao).toEqual({ primeiro: 20, segundo: 10 });
  });

  it("respeita multiplicadores configurados diferentes do padrão", () => {
    const premiacao = calcularPremiacaoDaPartida({
      valorDaPartida: 20,
      multiplicadorPremiacaoPrimeiro: 3,
      multiplicadorPremiacaoSegundo: 1.5,
    });

    expect(premiacao).toEqual({ primeiro: 60, segundo: 30 });
  });
});

describe("calcularEntradaNoCaixa", () => {
  it("com 8 participantes (R$80 arrecadados) e premiação de R$30, sobram R$50 pro Caixa", () => {
    const entrada = calcularEntradaNoCaixa(8, parametrosReais);

    expect(entrada).toBe(50);
  });

  it("com o mínimo de 5 participantes, a entrada nunca fica negativa", () => {
    const entrada = calcularEntradaNoCaixa(5, parametrosReais);

    // 5 x 10 = 50 arrecadados, 30 de premiação => 20 pro caixa
    expect(entrada).toBe(20);
  });
});
