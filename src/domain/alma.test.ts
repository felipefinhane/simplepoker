import { describe, expect, it } from "vitest";
import { calcularAlmas } from "./alma";

describe("calcularAlmas", () => {
  it("soma 1 pela própria alma quando termina em 1º", () => {
    expect(calcularAlmas(0, 1)).toBe(1);
  });

  it("soma 1 pela própria alma quando termina em 2º", () => {
    expect(calcularAlmas(0, 2)).toBe(1);
  });

  it("não soma a própria alma de quem foi eliminado (posição 3+)", () => {
    expect(calcularAlmas(0, 3)).toBe(0);
  });

  it("quem foi eliminado guarda as almas que já tinha coletado", () => {
    expect(calcularAlmas(2, 5)).toBe(2);
  });

  it("1º ou 2º que também eliminou gente soma tudo", () => {
    expect(calcularAlmas(2, 1)).toBe(3);
  });

  it("ainda ativo (sem posição) só conta o que já eliminou", () => {
    expect(calcularAlmas(1, null)).toBe(1);
  });
});
