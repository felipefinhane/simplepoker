import { describe, expect, it } from "vitest";
import {
  formatarMensagemRankingGeral,
  formatarMensagemResultadoPartida,
  linkDoWhatsapp,
} from "./whatsapp";

describe("formatarMensagemRankingGeral", () => {
  it("numera com medalhas nos 3 primeiros e número a partir do 4º", () => {
    const texto = formatarMensagemRankingGeral(
      [
        { nome: "Fulano", totalPontos: 46 },
        { nome: "Beto", totalPontos: 45 },
        { nome: "Caio", totalPontos: 40 },
        { nome: "Dedé", totalPontos: 30 },
      ],
      "03/02/2026",
    );

    expect(texto).toContain("🥇 Fulano — 46 pts");
    expect(texto).toContain("🥈 Beto — 45 pts");
    expect(texto).toContain("🥉 Caio — 40 pts");
    expect(texto).toContain("4º Dedé — 30 pts");
    expect(texto).toContain("*Ranking da Temporada* (desde 03/02/2026)");
  });
});

describe("formatarMensagemResultadoPartida", () => {
  it("ordena pela posição e ignora quem ainda não tem uma", () => {
    const texto = formatarMensagemResultadoPartida("10/08/2026", [
      { nome: "Beto", posicao: 2, pontos: 19 },
      { nome: "Fulano", posicao: 1, pontos: 26 },
      { nome: "Ativo", posicao: null, pontos: null },
    ]);

    const indiceFulano = texto.indexOf("Fulano");
    const indiceBeto = texto.indexOf("Beto");
    expect(indiceFulano).toBeGreaterThan(-1);
    expect(indiceBeto).toBeGreaterThan(indiceFulano);
    expect(texto).not.toContain("Ativo");
    expect(texto).toContain("*Resultado da Partida — 10/08/2026*");
  });
});

describe("linkDoWhatsapp", () => {
  it("gera uma URL wa.me com o texto codificado", () => {
    const link = linkDoWhatsapp("🏆 Ranking");
    expect(link).toBe("https://wa.me/?text=%F0%9F%8F%86%20Ranking");
  });

  it("trunca mensagens absurdamente longas", () => {
    const mensagemGigante = "x".repeat(5000);
    const link = linkDoWhatsapp(mensagemGigante);
    const texto = decodeURIComponent(link.replace("https://wa.me/?text=", ""));
    expect(texto.length).toBeLessThan(2000);
    expect(texto.endsWith("…")).toBe(true);
  });
});
