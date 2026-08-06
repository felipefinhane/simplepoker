import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { criarJogador } from "@/lib/jogadores";
import { criarTemporada } from "@/lib/temporadas";
import { criarPartida, lancarResultado } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";

const PARAMETROS_DE_TESTE = {
  tabelaDePontos: [
    [1, 25],
    [2, 18],
    [3, 15],
    [4, 12],
    [5, 10],
  ],
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
  estruturaDeBlinds: [],
  fichasIniciais: [],
};

async function limpar() {
  await db.query("DELETE FROM caixa_transacoes");
  await db.query("DELETE FROM lancamentos");
  await db.query("DELETE FROM partidas");
  await db.query("DELETE FROM temporadas");
  await db.query("DELETE FROM jogadores WHERE nome LIKE '%de Teste'");
}

beforeEach(limpar);
afterEach(limpar);
afterAll(async () => {
  await db.end();
});

describe("calcularRankingsDaTemporada (contra Postgres real)", () => {
  it("retorna null para uma Temporada que não existe", async () => {
    expect(await calcularRankingsDaTemporada(999999)).toBeNull();
  });

  it("agrega Lançamentos de várias Partidas e ordena os dois rankings", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`)),
    );
    const ids = jogadores.map((j) => j.id);

    // Partida 1: Ana 1º (2 almas), Beto 2º, Caio 3º, Dedé 4º, Elis 5º
    const partida1 = await criarPartida("2026-01-01", ids);
    await lancarResultado(
      partida1.id,
      ids.map((id, i) => ({ jogadorId: id, posicao: i + 1, almas: i === 0 ? 2 : 0, pagamento: true })),
    );

    // Partida 2: Beto 1º (3 almas), Ana 2º, Caio 3º, Dedé 4º, Elis 5º
    const partida2 = await criarPartida("2026-01-08", ids);
    const ordemInvertida = [ids[1], ids[0], ids[2], ids[3], ids[4]];
    await lancarResultado(
      partida2.id,
      ordemInvertida.map((id, i) => ({ jogadorId: id, posicao: i + 1, almas: i === 0 ? 3 : 0, pagamento: true })),
    );

    const rankings = await calcularRankingsDaTemporada(temporada.id);

    // Ana: 27 (1º+2almas) + 18 (2º) = 45 pontos, 2 almas
    // Beto: 18 (2º) + 28 (1º+3almas=25+3) = 46 pontos, 3 almas
    expect(rankings?.rankingDePontuacao[0]).toMatchObject({
      nome: "Beto de Teste",
      totalPontos: 46,
    });
    expect(rankings?.rankingDePontuacao[1]).toMatchObject({
      nome: "Ana de Teste",
      totalPontos: 45,
    });

    // Ranking Carrasco: Beto (3 almas) na frente de Ana (2 almas)
    expect(rankings?.rankingCarrasco[0]).toMatchObject({
      nome: "Beto de Teste",
      totalAlmas: 3,
    });

    // jogadorId no retorno é o id numérico de verdade do Jogador, não o nome.
    expect(rankings?.rankingDePontuacao[0].jogadorId).toBe(
      jogadores.find((j) => j.nome === "Beto de Teste")!.id,
    );
  });

  it("nunca mistura dois Jogadores com o mesmo nome", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const homonimos = await Promise.all([
      criarJogador("Zeca de Teste"),
      criarJogador("Zeca de Teste"),
    ]);
    const outros = await Promise.all(
      ["Ana", "Beto", "Caio"].map((n) => criarJogador(`${n} de Teste`)),
    );
    const ids = [...homonimos.map((j) => j.id), ...outros.map((j) => j.id)];

    const partida = await criarPartida("2026-01-01", ids);
    await lancarResultado(
      partida.id,
      ids.map((id, i) => ({ jogadorId: id, posicao: i + 1, almas: 0, pagamento: true })),
    );

    const rankings = await calcularRankingsDaTemporada(temporada.id);

    // 5 participantes, 2 com o mesmo nome — precisam continuar sendo 5
    // entradas distintas no ranking, não 4 (o que aconteceria se a
    // agregação juntasse os dois "Zeca de Teste" num só).
    expect(rankings?.rankingDePontuacao).toHaveLength(5);
  });

  it("ignora Partidas com resultado ainda não lançado", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`)),
    );
    const ids = jogadores.map((j) => j.id);

    await criarPartida("2026-01-01", ids); // nunca lançada

    const rankings = await calcularRankingsDaTemporada(temporada.id);

    expect(rankings?.rankingDePontuacao).toEqual([]);
    expect(rankings?.rankingCarrasco).toEqual([]);
  });
});
