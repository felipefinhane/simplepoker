import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { criarJogador, definirAtivoDoJogador } from "@/lib/jogadores";
import {
  TemporadaEncerradaError,
  criarTemporada,
  encerrarTemporada,
} from "@/lib/temporadas";
import {
  JogadorInvalidoError,
  LancamentosInvalidosError,
  MinimoDeParticipantesError,
  NenhumaTemporadaAbertaError,
  buscarPartidaPorId,
  criarPartida,
  lancarResultado,
} from "@/lib/partidas";

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

let jogadorIds: number[] = [];

async function limpar() {
  await db.query("DELETE FROM caixa_transacoes");
  await db.query("DELETE FROM lancamentos");
  await db.query("DELETE FROM partidas");
  await db.query("DELETE FROM temporadas");
  await db.query("DELETE FROM jogadores WHERE nome LIKE '%de Teste'");
}

beforeEach(async () => {
  await limpar();

  const jogadores = await Promise.all(
    ["Um", "Dois", "Três", "Quatro", "Cinco", "Seis"].map((n) =>
      criarJogador(`${n} de Teste`),
    ),
  );
  jogadorIds = jogadores.map((j) => j.id);
});

afterEach(async () => {
  await limpar();
});

afterAll(async () => {
  await db.end();
});

describe("criarPartida (contra Postgres real)", () => {
  it("recusa criar com menos de 5 participantes, mesmo com Temporada aberta", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);

    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 4)),
    ).rejects.toThrow(MinimoDeParticipantesError);
  });

  it("recusa criar sem Temporada aberta", async () => {
    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 5)),
    ).rejects.toThrow(NenhumaTemporadaAbertaError);
  });

  it("recusa um jogadorId desativado", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);
    await definirAtivoDoJogador(jogadorIds[0], false);

    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 5)),
    ).rejects.toThrow(JogadorInvalidoError);
  });

  it("cria a Partida com um Lançamento vazio (posicao null) por participante", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);

    const partida = await criarPartida("2026-01-10", participantes);

    expect(partida.temporadaId).toBe(temporada.id);
    expect(partida.lancamentos).toHaveLength(5);
    expect(partida.lancamentos.every((r) => r.posicao === null)).toBe(true);
    expect(partida.lancamentos.every((r) => r.pontos === null)).toBe(true);
  });
});

describe("lancarResultado (contra Postgres real)", () => {
  it("recusa se faltar ou sobrar um participante", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5));

    await expect(
      lancarResultado(
        partida.id,
        jogadorIds.slice(0, 4).map((id, i) => ({
          jogadorId: id,
          posicao: i + 1,
          almas: 0,
          pagamento: true,
        })),
      ),
    ).rejects.toThrow(LancamentosInvalidosError);
  });

  it("recusa posição inválida", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes);

    await expect(
      lancarResultado(
        partida.id,
        participantes.map((id, i) => ({
          jogadorId: id,
          posicao: i === 0 ? 0 : i + 1,
          almas: 0,
          pagamento: true,
        })),
      ),
    ).rejects.toThrow(LancamentosInvalidosError);
  });

  it("calcula Pontos, Premiação e gera a entrada automática no Caixa", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes);

    const resultado = await lancarResultado(
      partida.id,
      participantes.map((id, i) => ({
        jogadorId: id,
        posicao: i + 1,
        almas: i === 0 ? 2 : 0,
        pagamento: true,
      })),
    );

    // 1º lugar: 25 pontos + 2 almas = 27
    const primeiro = resultado!.partida.lancamentos.find((r) => r.posicao === 1);
    expect(primeiro?.pontos).toBe(27);

    // Premiação: 1º = 10*2 = 20, 2º = 10*1 = 10
    expect(resultado!.premiacao).toEqual({ primeiro: 20, segundo: 10 });

    // Entrada no caixa: 5 participantes * 10 - (20+10) = 20
    expect(resultado!.entradaNoCaixa).toBe(20);

    const { rows } = await db.query<{ valor: string; tipo: string }>(
      `SELECT valor, tipo FROM caixa_transacoes WHERE partida_id = $1`,
      [partida.id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].tipo).toBe("entrada_partida");
    expect(Number(rows[0].valor)).toBe(20);
  });

  it("editar o resultado substitui a entrada no Caixa em vez de duplicar", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes);

    const entradasIniciais = participantes.map((id, i) => ({
      jogadorId: id,
      posicao: i + 1,
      almas: 0,
      pagamento: true,
    }));
    await lancarResultado(partida.id, entradasIniciais);

    // Corrige quem ficou em 1º e 2º
    const entradasCorrigidas = [...entradasIniciais];
    [entradasCorrigidas[0], entradasCorrigidas[1]] = [
      { ...entradasCorrigidas[1], posicao: 1 },
      { ...entradasCorrigidas[0], posicao: 2 },
    ];
    const resultado = await lancarResultado(partida.id, entradasCorrigidas);

    expect(
      resultado!.partida.lancamentos.find((r) => r.jogadorId === participantes[1])
        ?.posicao,
    ).toBe(1);

    const { rows } = await db.query(
      `SELECT id FROM caixa_transacoes WHERE partida_id = $1`,
      [partida.id],
    );
    expect(rows).toHaveLength(1); // não duplicou
  });

  it("recusa lançar resultado numa Partida de Temporada já encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes);
    await encerrarTemporada(temporada.id);

    await expect(
      lancarResultado(
        partida.id,
        participantes.map((id, i) => ({
          jogadorId: id,
          posicao: i + 1,
          almas: 0,
          pagamento: true,
        })),
      ),
    ).rejects.toThrow(TemporadaEncerradaError);
  });

  it("retorna null para uma Partida que não existe", async () => {
    const resultado = await lancarResultado(999999, []);
    expect(resultado).toBeNull();
  });

  it("corrida real entre lançar resultado e encerrar a Temporada: nunca fica um lançamento gravado numa Temporada encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes);
    const entradas = participantes.map((id, i) => ({
      jogadorId: id,
      posicao: i + 1,
      almas: 0,
      pagamento: true,
    }));

    // Sem `await` entre as duas, pra forçar a corrida de verdade — é o
    // `SELECT ... FOR UPDATE` dentro de lancarResultado que decide quem
    // "ganha", não a ordem em que as chamadas aparecem aqui.
    const [resultadoDoLancamento, resultadoDoEncerramento] =
      await Promise.allSettled([
        lancarResultado(partida.id, entradas),
        encerrarTemporada(temporada.id),
      ]);

    expect(resultadoDoEncerramento.status).toBe("fulfilled");

    const { rows: entradasNoCaixa } = await db.query(
      `SELECT id FROM caixa_transacoes WHERE partida_id = $1`,
      [partida.id],
    );

    if (resultadoDoLancamento.status === "fulfilled") {
      // Lançou antes de a Temporada fechar: a entrada no Caixa existe.
      expect(entradasNoCaixa).toHaveLength(1);
    } else {
      // A Temporada fechou primeiro: lançar falhou com o erro certo, e
      // nada foi gravado — não um erro genérico, nem um estado corrompido.
      expect(
        (resultadoDoLancamento as PromiseRejectedResult).reason,
      ).toBeInstanceOf(TemporadaEncerradaError);
      expect(entradasNoCaixa).toHaveLength(0);
    }
  });
});

describe("buscarPartidaPorId (contra Postgres real)", () => {
  it("retorna null para um id que não existe", async () => {
    expect(await buscarPartidaPorId(999999)).toBeNull();
  });
});
