import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { criarJogador } from "@/lib/jogadores";
import { criarTemporada } from "@/lib/temporadas";
import { atualizarLancamento, criarPartida, finalizarPartida } from "@/lib/partidas";
import { calcularProjecaoDeRanking, calcularRankingsDaTemporada } from "@/lib/rankings";

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

/** Preenche posição (e eliminador) de todo mundo e finaliza de uma vez — atalho pra montar fixtures nos testes. */
async function finalizarComResultado(
  partidaId: number,
  entradas: { jogadorId: number; posicao: number; eliminadoPorJogadorId?: number | null }[],
) {
  for (const entrada of entradas) {
    await atualizarLancamento(partidaId, entrada.jogadorId, {
      posicao: entrada.posicao,
      eliminadoPorJogadorId: entrada.eliminadoPorJogadorId ?? null,
    }, null);
  }
  return finalizarPartida(partidaId, null);
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

  it("agrega Lançamentos de várias Partidas finalizadas e ordena os dois rankings", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`, null)),
    );
    const [ana, beto, caio, dede, elis] = jogadores.map((j) => j.id);

    // Partida 1: Ana 1º (elimina Caio), Beto 2º, Caio 3º, Dedé 4º, Elis 5º.
    // Almas: Ana = 1(própria)+1(matou Caio) = 2. Beto = 1(própria) = 1.
    // Pontos: Ana=25+2=27, Beto=18+1=19.
    const partida1 = await criarPartida("2026-01-01", [ana, beto, caio, dede, elis], null);
    await finalizarComResultado(partida1.id, [
      { jogadorId: ana, posicao: 1 },
      { jogadorId: beto, posicao: 2 },
      { jogadorId: caio, posicao: 3, eliminadoPorJogadorId: ana },
      { jogadorId: dede, posicao: 4 },
      { jogadorId: elis, posicao: 5 },
    ]);

    // Partida 2: Beto 1º (elimina Caio e Dedé), Ana 2º, Caio 3º, Dedé 4º, Elis 5º.
    // Almas: Beto = 1+2 = 3. Ana = 1.
    // Pontos: Beto=25+3=28, Ana=18+1=19.
    const partida2 = await criarPartida("2026-01-08", [ana, beto, caio, dede, elis], null);
    await finalizarComResultado(partida2.id, [
      { jogadorId: beto, posicao: 1 },
      { jogadorId: ana, posicao: 2 },
      { jogadorId: caio, posicao: 3, eliminadoPorJogadorId: beto },
      { jogadorId: dede, posicao: 4, eliminadoPorJogadorId: beto },
      { jogadorId: elis, posicao: 5 },
    ]);

    const rankings = await calcularRankingsDaTemporada(temporada.id);

    // Ana: 27+19=46 pontos, 2+1=3 almas. Beto: 19+28=47 pontos, 1+3=4 almas.
    expect(rankings?.rankingDePontuacao[0]).toMatchObject({
      nome: "Beto de Teste",
      totalPontos: 47,
    });
    expect(rankings?.rankingDePontuacao[1]).toMatchObject({
      nome: "Ana de Teste",
      totalPontos: 46,
    });

    expect(rankings?.rankingCarrasco[0]).toMatchObject({
      nome: "Beto de Teste",
      totalAlmas: 4,
    });

    // jogadorId no retorno é o id numérico de verdade do Jogador, não o nome.
    expect(rankings?.rankingDePontuacao[0].jogadorId).toBe(beto);
  });

  it("nunca mistura dois Jogadores com o mesmo nome", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const homonimos = await Promise.all([
      criarJogador("Zeca de Teste", null),
      criarJogador("Zeca de Teste", null),
    ]);
    const outros = await Promise.all(
      ["Ana", "Beto", "Caio"].map((n) => criarJogador(`${n} de Teste`, null)),
    );
    const ids = [...homonimos.map((j) => j.id), ...outros.map((j) => j.id)];

    const partida = await criarPartida("2026-01-01", ids, null);
    await finalizarComResultado(
      partida.id,
      ids.map((id, i) => ({ jogadorId: id, posicao: i + 1 })),
    );

    const rankings = await calcularRankingsDaTemporada(partida.temporadaId);

    // 5 participantes, 2 com o mesmo nome — precisam continuar sendo 5
    // entradas distintas no ranking, não 4 (o que aconteceria se a
    // agregação juntasse os dois "Zeca de Teste" num só).
    expect(rankings?.rankingDePontuacao).toHaveLength(5);
  });

  it("ignora Partidas ainda não finalizadas (mesmo com posições parciais preenchidas)", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`, null)),
    );
    const ids = jogadores.map((j) => j.id);

    const partida = await criarPartida("2026-01-01", ids, null);
    // Preenche todo mundo, mas NÃO finaliza.
    for (const [i, id] of ids.entries()) {
      await atualizarLancamento(partida.id, id, { posicao: i + 1 }, null);
    }

    const rankings = await calcularRankingsDaTemporada(temporada.id);

    expect(rankings?.rankingDePontuacao).toEqual([]);
    expect(rankings?.rankingCarrasco).toEqual([]);
  });
});

describe("calcularProjecaoDeRanking (ticket 50, contra Postgres real)", () => {
  it("retorna null para uma Temporada que não existe", async () => {
    expect(await calcularProjecaoDeRanking(999999, 1, 10)).toBeNull();
  });

  it("soma o total já oficial da Temporada com os pontos desta Partida", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`, null)),
    );
    const [ana, beto, caio, dede, elis] = jogadores.map((j) => j.id);

    // Partida 1 (finalizada): Ana 1º = 25+1(própria alma) = 26 pontos.
    const partida1 = await criarPartida("2026-01-01", [ana, beto, caio, dede, elis], null);
    await finalizarComResultado(partida1.id, [
      { jogadorId: ana, posicao: 1 },
      { jogadorId: beto, posicao: 2 },
      { jogadorId: caio, posicao: 3 },
      { jogadorId: dede, posicao: 4 },
      { jogadorId: elis, posicao: 5 },
    ]);

    // Ana já tem 26 pontos oficiais na Temporada; nesta 2ª Partida (ainda
    // em andamento) ela acabou de sair em 4º, valendo 12 pontos.
    const projecao = await calcularProjecaoDeRanking(temporada.id, ana, 12);

    expect(projecao).toEqual({
      totalAtualNaTemporada: 26,
      pontosDestaPartida: 12,
      totalProjetado: 38,
    });
  });

  it("considera 0 de base pra quem ainda não tem nenhuma Partida finalizada na Temporada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const novato = await criarJogador("Novato de Teste", null);

    const projecao = await calcularProjecaoDeRanking(temporada.id, novato.id, 15);

    expect(projecao).toEqual({
      totalAtualNaTemporada: 0,
      pontosDestaPartida: 15,
      totalProjetado: 15,
    });
  });
});
