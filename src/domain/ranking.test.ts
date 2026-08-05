import { describe, expect, it } from "vitest";
import { tabelaDePontosPadrao } from "./tabela-de-pontos";
import {
  agregarResultadosPorJogador,
  calcularRankingCarrasco,
  calcularRankingDePontuacao,
} from "./ranking";
import type { LancamentoDoJogador } from "./types";

describe("agregarResultadosPorJogador", () => {
  it("soma pontos e almas de vários lançamentos do mesmo jogador", () => {
    const lancamentos: LancamentoDoJogador[] = [
      { jogadorId: "sergio", posicao: 1, almas: 2 }, // 25 + 2 = 27
      { jogadorId: "sergio", posicao: 3, almas: 0 }, // 15 + 0 = 15
      { jogadorId: "felipe", posicao: 2, almas: 1 }, // 18 + 1 = 19
    ];

    const agregados = agregarResultadosPorJogador(
      lancamentos,
      tabelaDePontosPadrao,
    );

    expect(agregados).toEqual(
      expect.arrayContaining([
        { jogadorId: "sergio", totalPontos: 42, totalAlmas: 2 },
        { jogadorId: "felipe", totalPontos: 19, totalAlmas: 1 },
      ]),
    );
  });
});

describe("pipeline completo: lançamentos brutos -> agregação -> ranking", () => {
  // Dado sintético (não vem da planilha) — o objetivo aqui é provar que as
  // três funções se encaixam corretamente, não validar contra dado real.
  // A validação com dado real (mais abaixo) entra direto com os totais já
  // agregados, então não passa pelo cálculo de Pontos por lançamento; este
  // teste cobre exatamente essa lacuna.
  it("agrega lançamentos de 3 partidas e produz o ranking correto", () => {
    const lancamentos: LancamentoDoJogador[] = [
      // Partida 1
      { jogadorId: "sergio", posicao: 1, almas: 1 }, // 25 + 1 = 26
      { jogadorId: "felipe", posicao: 2, almas: 0 }, // 18
      // Partida 2
      { jogadorId: "sergio", posicao: 2, almas: 0 }, // 18
      { jogadorId: "felipe", posicao: 1, almas: 2 }, // 25 + 2 = 27
      // Partida 3
      { jogadorId: "sergio", posicao: 1, almas: 0 }, // 25
      { jogadorId: "felipe", posicao: 3, almas: 0 }, // 15
    ];

    const agregados = agregarResultadosPorJogador(
      lancamentos,
      tabelaDePontosPadrao,
    );
    const ranking = calcularRankingDePontuacao(agregados);

    // sergio: 26 + 18 + 25 = 69 pontos, 1 alma
    // felipe: 18 + 27 + 15 = 60 pontos, 2 almas
    expect(ranking).toEqual([
      { jogadorId: "sergio", totalPontos: 69, totalAlmas: 1 },
      { jogadorId: "felipe", totalPontos: 60, totalAlmas: 2 },
    ]);
  });
});

// Totais reais da Temporada em andamento, extraídos de POKER 1_2026.xlsx
// (aba de ranking): nome -> { totalPontos, totalAlmas }. Servem de fixture
// de regressão — a ordenação abaixo é a ordem já apurada manualmente na
// planilha, não um exemplo inventado.
const agregadosReaisDaPlanilha = [
  { jogadorId: "SERGIO", totalPontos: 279, totalAlmas: 29 },
  { jogadorId: "DANILO", totalPontos: 255, totalAlmas: 18 },
  { jogadorId: "NINO", totalPontos: 233, totalAlmas: 25 },
  { jogadorId: "EDINHO", totalPontos: 223, totalAlmas: 17 },
  { jogadorId: "UEDA", totalPontos: 184, totalAlmas: 11 },
  { jogadorId: "FELIPE", totalPontos: 170, totalAlmas: 14 },
  { jogadorId: "ENIO", totalPontos: 165, totalAlmas: 9 },
  { jogadorId: "CARLÃO", totalPontos: 133, totalAlmas: 7 },
  { jogadorId: "GRANDE", totalPontos: 129, totalAlmas: 8 },
  { jogadorId: "ALEXANDRE", totalPontos: 27, totalAlmas: 1 },
  { jogadorId: "TURATI", totalPontos: 20, totalAlmas: 2 },
  { jogadorId: "MICA", totalPontos: 0, totalAlmas: 0 },
];

describe("calcularRankingDePontuacao", () => {
  it("ordena pelos totais reais da planilha, do maior para o menor total de pontos", () => {
    // Embaralhado de propósito, pra garantir que é a função que ordena.
    const embaralhado = [...agregadosReaisDaPlanilha].reverse();

    const ranking = calcularRankingDePontuacao(embaralhado);

    expect(ranking.map((r) => r.jogadorId)).toEqual([
      "SERGIO",
      "DANILO",
      "NINO",
      "EDINHO",
      "UEDA",
      "FELIPE",
      "ENIO",
      "CARLÃO",
      "GRANDE",
      "ALEXANDRE",
      "TURATI",
      "MICA",
    ]);
  });

  it("em caso de empate em pontos, desempata por mais almas", () => {
    const ranking = calcularRankingDePontuacao([
      { jogadorId: "a-menos-almas", totalPontos: 50, totalAlmas: 1 },
      { jogadorId: "b-mais-almas", totalPontos: 50, totalAlmas: 5 },
    ]);

    expect(ranking.map((r) => r.jogadorId)).toEqual([
      "b-mais-almas",
      "a-menos-almas",
    ]);
  });

  it("empate total em pontos e almas desempata por ordem alfabética do jogador", () => {
    const ranking = calcularRankingDePontuacao([
      { jogadorId: "zeca", totalPontos: 10, totalAlmas: 1 },
      { jogadorId: "ana", totalPontos: 10, totalAlmas: 1 },
    ]);

    expect(ranking.map((r) => r.jogadorId)).toEqual(["ana", "zeca"]);
  });
});

describe("calcularRankingCarrasco", () => {
  it("ordena pelos totais reais da planilha, do maior para o menor total de almas", () => {
    const embaralhado = [...agregadosReaisDaPlanilha].reverse();

    const ranking = calcularRankingCarrasco(embaralhado);

    expect(ranking.map((r) => r.jogadorId)).toEqual([
      "SERGIO",
      "NINO",
      "DANILO",
      "EDINHO",
      "FELIPE",
      "UEDA",
      "ENIO",
      "GRANDE",
      "CARLÃO",
      "TURATI",
      "ALEXANDRE",
      "MICA",
    ]);
  });

  it("em caso de empate em almas, desempata por mais pontos", () => {
    const ranking = calcularRankingCarrasco([
      { jogadorId: "a-menos-pontos", totalPontos: 10, totalAlmas: 5 },
      { jogadorId: "b-mais-pontos", totalPontos: 30, totalAlmas: 5 },
    ]);

    expect(ranking.map((r) => r.jogadorId)).toEqual([
      "b-mais-pontos",
      "a-menos-pontos",
    ]);
  });
});
