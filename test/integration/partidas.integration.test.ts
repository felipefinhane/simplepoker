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
  DadosDaPartidaInvalidosError,
  MinimoDeParticipantesError,
  NenhumaTemporadaAbertaError,
  PartidaFinalizadaError,
  ResultadosIncompletosError,
  adicionarParticipante,
  atualizarLancamento,
  buscarPartidaPorId,
  criarPartida,
  editarDataDaPartida,
  finalizarPartida,
  marcarSaida,
  removerParticipante,
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
      criarJogador(`${n} de Teste`, null),
    ),
  );
  jogadorIds = jogadores.map((j) => j.id);
});

afterEach(limpar);
afterAll(async () => {
  await db.end();
});

describe("criarPartida (contra Postgres real)", () => {
  it("recusa criar com menos de 5 participantes, mesmo com Temporada aberta", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);

    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 4), null),
    ).rejects.toThrow(MinimoDeParticipantesError);
  });

  it("recusa criar sem Temporada aberta", async () => {
    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 5), null),
    ).rejects.toThrow(NenhumaTemporadaAbertaError);
  });

  it("recusa um jogadorId desativado", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    await definirAtivoDoJogador(jogadorIds[0], false, null);

    await expect(
      criarPartida("2026-01-10", jogadorIds.slice(0, 5), null),
    ).rejects.toThrow(JogadorInvalidoError);
  });

  it("cria a Partida não finalizada, com um Lançamento vazio por participante", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);

    const partida = await criarPartida("2026-01-10", participantes, null);

    expect(partida.temporadaId).toBe(temporada.id);
    expect(partida.finalizada).toBe(false);
    expect(partida.lancamentos).toHaveLength(5);
    expect(partida.lancamentos.every((l) => l.posicao === null)).toBe(true);
    expect(partida.lancamentos.every((l) => l.pontos === null)).toBe(true);
    expect(partida.lancamentos.every((l) => l.almas === 0)).toBe(true);
  });
});

describe("editarDataDaPartida (contra Postgres real)", () => {
  it("edita a data de uma Partida em andamento", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);

    const editada = await editarDataDaPartida(partida.id, "2026-01-15", null);
    expect(editada.data).toBe("2026-01-15");
  });

  it("recusa editar a data de uma Partida já finalizada", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }
    // Sobra 1 (o último) e mais nenhum — finaliza direto.
    await finalizarPartida(partida.id, null);

    await expect(editarDataDaPartida(partida.id, "2026-01-20", null)).rejects.toThrow(
      PartidaFinalizadaError,
    );
  });
});

describe("adicionarParticipante (contra Postgres real)", () => {
  it("adiciona um Jogador ativo que ainda não participava", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);

    const atualizada = await adicionarParticipante(partida.id, jogadorIds[5], null);

    expect(atualizada.lancamentos).toHaveLength(6);
    expect(atualizada.lancamentos.some((l) => l.jogadorId === jogadorIds[5])).toBe(true);
  });

  it("recusa adicionar quem já é participante", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);

    await expect(adicionarParticipante(partida.id, participantes[0], null)).rejects.toThrow(
      DadosDaPartidaInvalidosError,
    );
  });

  it("recusa adicionar um Jogador desativado", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);
    await definirAtivoDoJogador(jogadorIds[5], false, null);

    await expect(adicionarParticipante(partida.id, jogadorIds[5], null)).rejects.toThrow(
      JogadorInvalidoError,
    );
  });
});

describe("removerParticipante (contra Postgres real)", () => {
  it("remove um participante ainda ativo, sem resultado lançado", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds, null); // 6 participantes

    const atualizada = await removerParticipante(partida.id, jogadorIds[5]);

    expect(atualizada.lancamentos).toHaveLength(5);
    expect(atualizada.lancamentos.some((l) => l.jogadorId === jogadorIds[5])).toBe(false);
  });

  it("recusa remover quem não é participante desta Partida", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);

    await expect(removerParticipante(partida.id, jogadorIds[5])).rejects.toThrow(
      DadosDaPartidaInvalidosError,
    );
  });

  it("recusa remover quem já tem posição registrada (já saiu)", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e, f] = jogadorIds;
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e, f], null);
    await marcarSaida(partida.id, f, a, null);

    await expect(removerParticipante(partida.id, f)).rejects.toThrow(
      DadosDaPartidaInvalidosError,
    );
  });

  it("recusa remover quem já eliminou alguém, mesmo ainda ativo", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e, f] = jogadorIds;
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e, f], null);
    await marcarSaida(partida.id, f, a, null); // a elimina f, a continua ativo

    await expect(removerParticipante(partida.id, a)).rejects.toThrow(
      DadosDaPartidaInvalidosError,
    );
  });

  it("recusa remover se ficaria abaixo do mínimo de participantes", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);

    await expect(removerParticipante(partida.id, jogadorIds[0])).rejects.toThrow(
      MinimoDeParticipantesError,
    );
  });

  it("recusa remover de uma Partida já finalizada", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }
    await finalizarPartida(partida.id, null);

    await expect(removerParticipante(partida.id, participantes[4])).rejects.toThrow(
      PartidaFinalizadaError,
    );
  });
});

describe("atualizarLancamento (contra Postgres real)", () => {
  it("atualiza posicao, eliminador e pagamento parcialmente", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);

    await atualizarLancamento(partida.id, participantes[0], { pagamento: true }, null);
    const atualizada = await atualizarLancamento(partida.id, participantes[1], {
      posicao: 5,
      eliminadoPorJogadorId: participantes[0],
    }, null);

    const linha0 = atualizada.lancamentos.find((l) => l.jogadorId === participantes[0]);
    const linha1 = atualizada.lancamentos.find((l) => l.jogadorId === participantes[1]);
    expect(linha0?.pagamento).toBe(true);
    expect(linha1?.posicao).toBe(5);
    expect(linha1?.eliminadoPorJogadorId).toBe(participantes[0]);
  });

  it("recusa duas posições iguais na mesma Partida", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    await atualizarLancamento(partida.id, participantes[0], { posicao: 5 }, null);

    await expect(
      atualizarLancamento(partida.id, participantes[1], { posicao: 5 }, null),
    ).rejects.toThrow(DadosDaPartidaInvalidosError);
  });

  it("recusa um Jogador eliminando a si mesmo", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);

    await expect(
      atualizarLancamento(partida.id, participantes[0], {
        eliminadoPorJogadorId: participantes[0],
      }, null),
    ).rejects.toThrow(DadosDaPartidaInvalidosError);
  });

  it("recusa um eliminador que não é participante desta Partida", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);

    await expect(
      atualizarLancamento(partida.id, participantes[0], {
        eliminadoPorJogadorId: jogadorIds[5],
      }, null),
    ).rejects.toThrow(DadosDaPartidaInvalidosError);
  });

  it("recusa editar Lançamento de Partida já finalizada", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }
    await finalizarPartida(partida.id, null);

    await expect(
      atualizarLancamento(partida.id, participantes[0], { pagamento: true }, null),
    ).rejects.toThrow(PartidaFinalizadaError);
  });
});

describe("marcarSaida (contra Postgres real)", () => {
  it("atribui posição contando os participantes ainda ativos, do maior pro menor", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e] = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e], null);

    const depoisDeUm = await marcarSaida(partida.id, e, c, null);
    expect(depoisDeUm.lancamentos.find((l) => l.jogadorId === e)?.posicao).toBe(5);

    const depoisDeDois = await marcarSaida(partida.id, d, a, null);
    expect(depoisDeDois.lancamentos.find((l) => l.jogadorId === d)?.posicao).toBe(4);
  });

  it("recusa um eliminador que já não está mais ativo", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e] = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e], null);
    await marcarSaida(partida.id, e, c, null); // c ainda ativo aqui

    await expect(marcarSaida(partida.id, d, e, null)).rejects.toThrow(DadosDaPartidaInvalidosError);
  });

  it("recusa marcar saída de quem já tem posição", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e] = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e], null);
    await marcarSaida(partida.id, e, c, null);

    await expect(marcarSaida(partida.id, e, c, null)).rejects.toThrow(DadosDaPartidaInvalidosError);
  });

  it("convive com o fluxo manual sem duplicar posição: uma posição atribuída fora de ordem por atualizarLancamento não é reaproveitada por uma saída incremental", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e, f] = jogadorIds;
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e, f], null);

    // O Organizador já sabe (por algum motivo) que D ficou em 4º e lança
    // isso direto, fora de ordem — sem passar por marcarSaida.
    await atualizarLancamento(partida.id, d, { posicao: 4 }, null);

    // Agora E sai "ao vivo" — a próxima posição livre, contando do maior
    // pro menor entre as 6, é a 6ª (a 4ª já foi ocupada por D).
    const atualizada = await marcarSaida(partida.id, e, c, null);
    expect(atualizada.lancamentos.find((l) => l.jogadorId === e)?.posicao).toBe(6);

    const posicoes = atualizada.lancamentos.map((l) => l.posicao).filter((p) => p !== null);
    expect(new Set(posicoes).size).toBe(posicoes.length);
  });

  it("corrida real entre duas saídas simultâneas na mesma Partida: nunca duas pessoas recebem a mesma posição", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e] = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e], null);

    // Sem `await` entre as duas, pra forçar a corrida de verdade: D e E
    // saem "ao mesmo tempo", cada um eliminado por um ainda ativo (A/B).
    const [resultadoD, resultadoE] = await Promise.allSettled([
      marcarSaida(partida.id, d, a, null),
      marcarSaida(partida.id, e, b, null),
    ]);

    expect(resultadoD.status).toBe("fulfilled");
    expect(resultadoE.status).toBe("fulfilled");

    const partidaFinal = await buscarPartidaPorId(partida.id);
    const posicaoDeD = partidaFinal?.lancamentos.find((l) => l.jogadorId === d)?.posicao;
    const posicaoDeE = partidaFinal?.lancamentos.find((l) => l.jogadorId === e)?.posicao;

    expect(posicaoDeD).not.toBeNull();
    expect(posicaoDeE).not.toBeNull();
    expect(posicaoDeD).not.toBe(posicaoDeE);
    expect(new Set([posicaoDeD, posicaoDeE])).toEqual(new Set([4, 5]));
  });
});

describe("finalizarPartida (contra Postgres real)", () => {
  it("cenário completo: eliminações em cadeia, 1º/2º manuais, Almas e Caixa corretos", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const [a, b, c, d, e] = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", [a, b, c, d, e], null);

    // E sai eliminado por C; D sai eliminado por A; C sai eliminado por B.
    await marcarSaida(partida.id, e, c, null);
    await marcarSaida(partida.id, d, a, null);
    await marcarSaida(partida.id, c, b, null);

    // Sobram A e B — o Organizador decide manualmente quem foi 2º...
    await atualizarLancamento(partida.id, b, { posicao: 2 }, null);
    // ...e finalizar atribui A como 1º automaticamente (só ele sem posição).
    const resultado = await finalizarPartida(partida.id, null);

    expect(resultado.partida.finalizada).toBe(true);
    const porId = new Map(resultado.partida.lancamentos.map((l) => [l.jogadorId, l]));

    // A: 1º + eliminou D = 1 (própria alma) + 1 = 2 almas; pontos = 25+2=27
    expect(porId.get(a)).toMatchObject({ posicao: 1, almas: 2, pontos: 27 });
    // B: 2º + eliminou C = 1 + 1 = 2 almas; pontos = 18+2=20
    expect(porId.get(b)).toMatchObject({ posicao: 2, almas: 2, pontos: 20 });
    // C: eliminado, mas eliminou E antes = 1 alma (guardada); pontos = 15+1=16
    expect(porId.get(c)).toMatchObject({ posicao: 3, almas: 1, pontos: 16 });
    // D: eliminado, não eliminou ninguém = 0 almas; pontos = 12+0=12
    expect(porId.get(d)).toMatchObject({ posicao: 4, almas: 0, pontos: 12 });
    // E: eliminado, não eliminou ninguém = 0 almas; pontos = 10+0=10
    expect(porId.get(e)).toMatchObject({ posicao: 5, almas: 0, pontos: 10 });

    // Premiação: 1º = 10*2=20, 2º=10*1=10. Caixa: 5*10 - 30 = 20.
    expect(resultado.premiacao).toEqual({ primeiro: 20, segundo: 10 });
    expect(resultado.entradaNoCaixa).toBe(20);

    const { rows } = await db.query<{ valor: string }>(
      `SELECT valor FROM caixa_transacoes WHERE partida_id = $1`,
      [partida.id],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].valor)).toBe(20);
  });

  it("recusa finalizar com mais de um participante sem posição", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const partida = await criarPartida("2026-01-10", jogadorIds.slice(0, 5), null);

    await expect(finalizarPartida(partida.id, null)).rejects.toThrow(ResultadosIncompletosError);
  });

  it("trava a Partida contra novas edições depois de finalizada", async () => {
    await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }
    await finalizarPartida(partida.id, null);

    await expect(
      adicionarParticipante(partida.id, jogadorIds[5], null),
    ).rejects.toThrow(PartidaFinalizadaError);
    await expect(marcarSaida(partida.id, participantes[0], null, null)).rejects.toThrow(
      PartidaFinalizadaError,
    );
    await expect(finalizarPartida(partida.id, null)).rejects.toThrow(PartidaFinalizadaError);
  });

  it("recusa finalizar numa Temporada já encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }
    await encerrarTemporada(temporada.id, null);

    await expect(finalizarPartida(partida.id, null)).rejects.toThrow(TemporadaEncerradaError);
  });

  it("corrida real entre finalizar e encerrar a Temporada: nunca fica uma Partida finalizada numa Temporada encerrada", async () => {
    const temporada = await criarTemporada(PARAMETROS_DE_TESTE, null);
    const participantes = jogadorIds.slice(0, 5);
    const partida = await criarPartida("2026-01-10", participantes, null);
    for (const id of participantes.slice(0, 4)) {
      await marcarSaida(partida.id, id, null, null);
    }

    const [resultadoDaFinalizacao, resultadoDoEncerramento] = await Promise.allSettled([
      finalizarPartida(partida.id, null),
      encerrarTemporada(temporada.id, null),
    ]);

    expect(resultadoDoEncerramento.status).toBe("fulfilled");

    const partidaFinal = await buscarPartidaPorId(partida.id);
    if (resultadoDaFinalizacao.status === "fulfilled") {
      expect(partidaFinal?.finalizada).toBe(true);
    } else {
      expect(
        (resultadoDaFinalizacao as PromiseRejectedResult).reason,
      ).toBeInstanceOf(TemporadaEncerradaError);
      expect(partidaFinal?.finalizada).toBe(false);
    }
  });
});

describe("buscarPartidaPorId (contra Postgres real)", () => {
  it("retorna null para um id que não existe", async () => {
    expect(await buscarPartidaPorId(999999)).toBeNull();
  });
});
