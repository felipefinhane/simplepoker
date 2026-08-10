import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  JaExisteTemporadaAbertaError,
  TemporadaEncerradaError,
  TemporadaJaAbertaError,
  buscarTemporadaAberta,
  criarTemporada,
  editarParametrosDaTemporada,
  encerrarTemporada,
  obterParametrosPadraoParaNovaTemporada,
  reabrirTemporada,
} from "@/lib/temporadas";

const PARAMETROS_DE_TESTE = {
  tabelaDePontos: [
    [1, 25],
    [2, 18],
  ],
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
  estruturaDeBlinds: [],
  fichasIniciais: [],
};

beforeEach(async () => {
  await db.query("DELETE FROM temporadas");
});

afterAll(async () => {
  await db.query("DELETE FROM temporadas");
  await db.end();
});

describe("criarTemporada / buscarTemporadaAberta (contra Postgres real)", () => {
  it("cria uma Temporada aberta com os parâmetros informados", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);

    expect(temporada.aberta).toBe(true);
    expect(temporada.dataFim).toBeNull();
    expect(temporada.parametros.valorDaPartida).toBe(10);
    expect(temporada.parametros.tabelaDePontos.get(1)).toBe(25);
  });

  it("recusa criar uma segunda Temporada enquanto a primeira está aberta", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);

    await expect(criarTemporada(PARAMETROS_DE_TESTE, null)).rejects.toThrow(
      JaExisteTemporadaAbertaError,
    );
  });

  it("duas criações concorrentes: só uma vence, a outra recebe JaExisteTemporadaAbertaError (não um erro genérico do Postgres)", async () => {
    // Sem `await` entre as duas chamadas, pra forçar a corrida de verdade:
    // as duas passam pela checagem da aplicação antes de qualquer INSERT
    // terminar, então quem trava é o índice único do banco — e é isso que
    // este teste confirma que vira o erro de domínio certo, não um 500.
    const resultados = await Promise.allSettled([
      criarTemporada(PARAMETROS_DE_TESTE, null),
      criarTemporada(PARAMETROS_DE_TESTE, null),
    ]);

    const sucessos = resultados.filter((r) => r.status === "fulfilled");
    const falhas = resultados.filter((r) => r.status === "rejected");

    expect(sucessos).toHaveLength(1);
    expect(falhas).toHaveLength(1);
    expect((falhas[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      JaExisteTemporadaAbertaError,
    );
  });

  it("buscarTemporadaAberta retorna null quando não há nenhuma", async () => {
    expect(await buscarTemporadaAberta()).toBeNull();
  });
});

describe("editarParametrosDaTemporada / encerrarTemporada (contra Postgres real)", () => {
  it("edita os parâmetros de uma Temporada aberta", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);

    const editada = await editarParametrosDaTemporada(temporada.id, {
      ...PARAMETROS_DE_TESTE,
      valorDaPartida: 20,
    }, null);

    expect(editada?.parametros.valorDaPartida).toBe(20);
  });

  it("encerra a Temporada e passa a recusar novas edições", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);

    const encerrada = await encerrarTemporada(temporada.id, null);
    expect(encerrada?.aberta).toBe(false);
    expect(encerrada?.dataFim).not.toBeNull();

    await expect(
      editarParametrosDaTemporada(temporada.id, PARAMETROS_DE_TESTE, null),
    ).rejects.toThrow(TemporadaEncerradaError);

    await expect(encerrarTemporada(temporada.id, null)).rejects.toThrow(
      TemporadaEncerradaError,
    );
  });

  it("depois de encerrar, uma nova Temporada pode ser criada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    await encerrarTemporada(temporada.id, null);

    const nova = await criarTemporada(PARAMETROS_DE_TESTE, null);
    expect(nova.aberta).toBe(true);
    expect(nova.id).not.toBe(temporada.id);
  });
});

describe("reabrirTemporada (contra Postgres real)", () => {
  it("reabre uma Temporada encerrada, zerando data_fim", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    await encerrarTemporada(temporada.id, null);

    const reaberta = await reabrirTemporada(temporada.id, null);
    expect(reaberta?.aberta).toBe(true);
    expect(reaberta?.dataFim).toBeNull();
  });

  it("retorna null para um id que não existe", async () => {
    expect(await reabrirTemporada(999999, null)).toBeNull();
  });

  it("recusa reabrir uma Temporada que já está aberta", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);

    await expect(reabrirTemporada(temporada.id, null)).rejects.toThrow(
      TemporadaJaAbertaError,
    );
  });

  it("recusa reabrir enquanto outra Temporada está aberta", async () => {
    const primeira = await criarTemporada(PARAMETROS_DE_TESTE, null);
    await encerrarTemporada(primeira.id, null);
    await criarTemporada(PARAMETROS_DE_TESTE, null); // a segunda, aberta

    await expect(reabrirTemporada(primeira.id, null)).rejects.toThrow(
      JaExisteTemporadaAbertaError,
    );
  });

  it("corrida real entre reabrir e criar uma nova Temporada: nunca ficam duas abertas", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    await encerrarTemporada(temporada.id, null);

    // Sem `await` entre as duas chamadas — mesmo motivo do teste de
    // criação concorrente acima: força as duas a passarem pelo pré-check
    // antes de qualquer escrita terminar, então quem decide é o índice
    // único do banco.
    const resultados = await Promise.allSettled([
      reabrirTemporada(temporada.id, null),
      criarTemporada(PARAMETROS_DE_TESTE, null),
    ]);

    const sucessos = resultados.filter((r) => r.status === "fulfilled");
    expect(sucessos).toHaveLength(1);

    const { rows } = await db.query<{ count: string }>(
      "SELECT count(*) FROM temporadas WHERE aberta = true",
    );
    expect(rows[0].count).toBe("1");
  });
});

describe("obterParametrosPadraoParaNovaTemporada (contra Postgres real)", () => {
  it("sem nenhuma Temporada, usa os valores padrão confirmados com o Organizador", async () => {
    const padrao = await obterParametrosPadraoParaNovaTemporada();

    expect(padrao.valorDaPartida).toBe(10);
    expect(padrao.multiplicadorPremiacaoPrimeiro).toBe(2);
    expect(padrao.multiplicadorPremiacaoSegundo).toBe(1);
    expect(padrao.tabelaDePontos.get(1)).toBe(25);
  });

  it("com uma Temporada existente, usa os parâmetros dela como padrão", async () => {
    await criarTemporada({ ...PARAMETROS_DE_TESTE, valorDaPartida: 15 }, null);

    const padrao = await obterParametrosPadraoParaNovaTemporada();
    expect(padrao.valorDaPartida).toBe(15);
  });
});
