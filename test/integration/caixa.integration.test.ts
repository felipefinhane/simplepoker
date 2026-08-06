import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { criarJogador } from "@/lib/jogadores";
import {
  TemporadaEncerradaError,
  criarTemporada,
  encerrarTemporada,
} from "@/lib/temporadas";
import { criarPartida, lancarResultado } from "@/lib/partidas";
import {
  DadosDaSaidaInvalidosError,
  calcularSaldoDaTemporada,
  lancarSaidaManual,
  listarTransacoesDaTemporada,
} from "@/lib/caixa";

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

describe("lancarSaidaManual / listarTransacoesDaTemporada / calcularSaldoDaTemporada (contra Postgres real)", () => {
  it("uma Partida lançada gera a entrada automática, e o saldo reflete isso", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`)),
    );
    const ids = jogadores.map((j) => j.id);
    const partida = await criarPartida("2026-01-01", ids);
    await lancarResultado(
      partida.id,
      ids.map((id, i) => ({ jogadorId: id, posicao: i + 1, almas: 0, pagamento: true })),
    );

    // 5 * 10 - (20 + 10) = 20
    const saldo = await calcularSaldoDaTemporada(temporada.id);
    expect(saldo).toBe(20);

    const transacoes = await listarTransacoesDaTemporada(temporada.id);
    expect(transacoes).toHaveLength(1);
    expect(transacoes[0]).toMatchObject({ tipo: "entrada_partida", valor: 20 });
  });

  it("lança uma saída manual e desconta do saldo", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);

    const transacao = await lancarSaidaManual(temporada.id, {
      data: "2026-01-05",
      descricao: "Compra de baralho",
      valor: 39,
    });

    expect(transacao).toMatchObject({
      tipo: "saida_manual",
      valor: 39,
      descricao: "Compra de baralho",
    });

    const saldo = await calcularSaldoDaTemporada(temporada.id);
    expect(saldo).toBe(-39);
  });

  it("saldo combina entradas automáticas e saídas manuais corretamente", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const jogadores = await Promise.all(
      ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`)),
    );
    const ids = jogadores.map((j) => j.id);
    const partida = await criarPartida("2026-01-01", ids);
    await lancarResultado(
      partida.id,
      ids.map((id, i) => ({ jogadorId: id, posicao: i + 1, almas: 0, pagamento: true })),
    );
    await lancarSaidaManual(temporada.id, {
      data: "2026-01-05",
      descricao: "Baralho",
      valor: 15,
    });

    // 20 (entrada) - 15 (saída) = 5
    const saldo = await calcularSaldoDaTemporada(temporada.id);
    expect(saldo).toBe(5);

    const transacoes = await listarTransacoesDaTemporada(temporada.id);
    expect(transacoes).toHaveLength(2);
  });

  it("recusa saída manual com valor não positivo", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);

    await expect(
      lancarSaidaManual(temporada.id, { data: "2026-01-05", descricao: "Algo", valor: 0 }),
    ).rejects.toThrow(DadosDaSaidaInvalidosError);
  });

  it("recusa saída manual sem descrição", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);

    await expect(
      lancarSaidaManual(temporada.id, { data: "2026-01-05", descricao: "   ", valor: 10 }),
    ).rejects.toThrow(DadosDaSaidaInvalidosError);
  });

  it("recusa saída manual numa Temporada encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    await encerrarTemporada(temporada.id);

    await expect(
      lancarSaidaManual(temporada.id, { data: "2026-01-05", descricao: "Algo", valor: 10 }),
    ).rejects.toThrow(TemporadaEncerradaError);
  });

  it("saldo de uma Temporada sem nenhuma transação é zero", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    expect(await calcularSaldoDaTemporada(temporada.id)).toBe(0);
  });

  it("corrida real entre lançar saída manual e encerrar a Temporada: nunca fica uma saída gravada numa Temporada encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);

    // Sem `await` entre as duas, pra forçar a corrida de verdade.
    const [resultadoDaSaida, resultadoDoEncerramento] = await Promise.allSettled([
      lancarSaidaManual(temporada.id, {
        data: "2026-01-05",
        descricao: "Baralho",
        valor: 39,
      }),
      encerrarTemporada(temporada.id),
    ]);

    expect(resultadoDoEncerramento.status).toBe("fulfilled");

    const transacoes = await listarTransacoesDaTemporada(temporada.id);

    if (resultadoDaSaida.status === "fulfilled") {
      expect(transacoes).toHaveLength(1);
    } else {
      expect((resultadoDaSaida as PromiseRejectedResult).reason).toBeInstanceOf(
        TemporadaEncerradaError,
      );
      expect(transacoes).toHaveLength(0);
    }
  });
});
