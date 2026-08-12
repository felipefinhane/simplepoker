import { describe, expect, it } from "vitest";
import { formatarTop3Texto } from "./push";

describe("formatarTop3Texto", () => {
  it("formata o top 3 com medalhas, na ordem da posição", () => {
    const texto = formatarTop3Texto([
      { nome: "Beltrano", posicao: 2, pontos: 18 },
      { nome: "Fulano", posicao: 1, pontos: 25 },
      { nome: "Ciclano", posicao: 3, pontos: 12 },
      { nome: "Zé", posicao: 4, pontos: 10 },
    ]);

    expect(texto).toBe("🥇 Fulano · 🥈 Beltrano · 🥉 Ciclano");
  });

  it("ignora quem ainda não tem posição", () => {
    const texto = formatarTop3Texto([
      { nome: "Fulano", posicao: 1, pontos: 25 },
      { nome: "Ativo", posicao: null, pontos: null },
    ]);

    expect(texto).toBe("🥇 Fulano");
  });

  it("funciona com menos de 3 participantes", () => {
    const texto = formatarTop3Texto([{ nome: "Único", posicao: 1, pontos: 5 }]);

    expect(texto).toBe("🥇 Único");
  });

  it("retorna string vazia sem ninguém posicionado", () => {
    expect(formatarTop3Texto([])).toBe("");
  });
});
