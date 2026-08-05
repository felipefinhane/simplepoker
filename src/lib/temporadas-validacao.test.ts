import { describe, expect, it } from "vitest";
import { ParametrosInvalidosError, validarParametros } from "./temporadas";

const PARAMETROS_VALIDOS = {
  tabelaDePontos: [
    [1, 25],
    [2, 18],
  ],
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
  estruturaDeBlinds: [{ blindPequeno: 1, blindGrande: 2, duracaoMinutos: 15 }],
  fichasIniciais: [{ valor: 100, quantidade: 20 }],
};

describe("validarParametros", () => {
  it("aceita parâmetros válidos e converte tabelaDePontos pra Map", () => {
    const parametros = validarParametros(PARAMETROS_VALIDOS);

    expect(parametros.tabelaDePontos).toEqual(new Map([[1, 25], [2, 18]]));
    expect(parametros.valorDaPartida).toBe(10);
    expect(parametros.estruturaDeBlinds).toEqual(PARAMETROS_VALIDOS.estruturaDeBlinds);
    expect(parametros.fichasIniciais).toEqual(PARAMETROS_VALIDOS.fichasIniciais);
  });

  it("aceita estruturaDeBlinds e fichasIniciais vazias", () => {
    const parametros = validarParametros({
      ...PARAMETROS_VALIDOS,
      estruturaDeBlinds: [],
      fichasIniciais: [],
    });

    expect(parametros.estruturaDeBlinds).toEqual([]);
    expect(parametros.fichasIniciais).toEqual([]);
  });

  it("rejeita valorDaPartida zero ou negativo", () => {
    expect(() =>
      validarParametros({ ...PARAMETROS_VALIDOS, valorDaPartida: 0 }),
    ).toThrow(ParametrosInvalidosError);
    expect(() =>
      validarParametros({ ...PARAMETROS_VALIDOS, valorDaPartida: -5 }),
    ).toThrow(ParametrosInvalidosError);
  });

  it("rejeita multiplicador negativo", () => {
    expect(() =>
      validarParametros({
        ...PARAMETROS_VALIDOS,
        multiplicadorPremiacaoPrimeiro: -1,
      }),
    ).toThrow(ParametrosInvalidosError);
  });

  it("aceita multiplicador zero (premiação zerada é uma configuração válida)", () => {
    const parametros = validarParametros({
      ...PARAMETROS_VALIDOS,
      multiplicadorPremiacaoSegundo: 0,
    });
    expect(parametros.multiplicadorPremiacaoSegundo).toBe(0);
  });

  it("rejeita posição inválida na tabela de pontos", () => {
    expect(() =>
      validarParametros({
        ...PARAMETROS_VALIDOS,
        tabelaDePontos: [[0, 25]],
      }),
    ).toThrow(ParametrosInvalidosError);
  });

  it("rejeita nível de blind com valor não positivo", () => {
    expect(() =>
      validarParametros({
        ...PARAMETROS_VALIDOS,
        estruturaDeBlinds: [{ blindPequeno: 0, blindGrande: 2, duracaoMinutos: 15 }],
      }),
    ).toThrow(ParametrosInvalidosError);
  });

  it("rejeita ficha com quantidade não positiva", () => {
    expect(() =>
      validarParametros({
        ...PARAMETROS_VALIDOS,
        fichasIniciais: [{ valor: 100, quantidade: 0 }],
      }),
    ).toThrow(ParametrosInvalidosError);
  });

  it("rejeita entrada que não é um objeto", () => {
    expect(() => validarParametros(null)).toThrow(ParametrosInvalidosError);
    expect(() => validarParametros("nada")).toThrow(ParametrosInvalidosError);
  });
});
