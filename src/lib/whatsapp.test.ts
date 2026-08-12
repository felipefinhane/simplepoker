import { describe, expect, it } from "vitest";
import {
  formatarMensagemRankingGeral,
  formatarMensagemResultadoPartida,
  linkDoWhatsapp,
} from "./whatsapp";

describe("formatarMensagemRankingGeral", () => {
  it("monta uma tabela (bloco monoespaçado) na ordem recebida, com Pontos e Almas", () => {
    const texto = formatarMensagemRankingGeral(
      [
        { nome: "Fulano", totalPontos: 46, totalAlmas: 3 },
        { nome: "Beto", totalPontos: 45, totalAlmas: 4 },
        { nome: "Caio", totalPontos: 40, totalAlmas: 2 },
        { nome: "Dedé", totalPontos: 30, totalAlmas: 1 },
      ],
      "03/02/2026",
    );

    expect(texto).toContain("```");
    expect(texto).toMatch(/Pos\s+Jogador\s+Pts\s+Almas/);
    // Ordem preservada (quem chama já manda ordenado — é a saída de `calcularRankingDePontuacao`).
    const indices = ["Fulano", "Beto", "Caio", "Dedé"].map((nome) => texto.indexOf(nome));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    // Linha do Beto tem os números certos de Pontos e Almas.
    const linhaDoBeto = texto.split("\n").find((linha) => linha.includes("Beto"));
    expect(linhaDoBeto).toMatch(/45.*4/);
    expect(texto).toContain("*Ranking da Temporada* (desde 03/02/2026)");
    expect(texto).toContain("🥇 Líder: *Fulano*");
  });

  it("não quebra com ranking vazio", () => {
    const texto = formatarMensagemRankingGeral([], "03/02/2026");
    expect(texto).not.toContain("🥇 Líder:");
    expect(texto).toContain("```");
  });
});

describe("formatarMensagemResultadoPartida", () => {
  it("monta uma tabela (bloco monoespaçado) ordenada pela posição, com quem eliminou quem", () => {
    const texto = formatarMensagemResultadoPartida("10/08/2026", [
      { nome: "Beto", posicao: 2, pontos: 19, eliminadoPorNome: "Fulano" },
      { nome: "Fulano", posicao: 1, pontos: 26, eliminadoPorNome: null },
      { nome: "Ativo", posicao: null, pontos: null, eliminadoPorNome: null },
    ]);

    // Bloco monoespaçado (a única forma de alinhar colunas no WhatsApp).
    expect(texto).toContain("```");
    // Cabeçalho da tabela.
    expect(texto).toMatch(/Pos\s+Jogador\s+Pts\s+Eliminado por/);
    // Ordem: Fulano (1º) antes de Beto (2º).
    const indiceFulano = texto.indexOf("Fulano");
    const indiceBeto = texto.indexOf("Beto");
    expect(indiceFulano).toBeGreaterThan(-1);
    expect(indiceBeto).toBeGreaterThan(indiceFulano);
    // Quem saiu sem Posição não entra na tabela.
    expect(texto).not.toContain("Ativo");
    // Linha do Beto mostra quem eliminou ele.
    const linhaDoBeto = texto.split("\n").find((linha) => linha.includes("Beto"));
    expect(linhaDoBeto).toContain("Fulano");
    expect(texto).toContain("*Resultado da Partida — 10/08/2026*");
    expect(texto).toContain("🏆 Vitória de *Fulano*!");
  });

  it("não quebra sem nenhum participante com Posição definida", () => {
    const texto = formatarMensagemResultadoPartida("10/08/2026", [
      { nome: "Ativo", posicao: null, pontos: null, eliminadoPorNome: null },
    ]);

    expect(texto).not.toContain("🏆 Vitória de");
    expect(texto).toContain("```");
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
