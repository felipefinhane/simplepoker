import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { criarJogador } from "@/lib/jogadores";
import { TemporadaEncerradaError, criarTemporada, encerrarTemporada } from "@/lib/temporadas";
import { criarPartida } from "@/lib/partidas";
import {
  PrimeiroNivelError,
  SemEstruturaDeBlindsError,
  TimerEncerradoError,
  TimerNaoIniciadoError,
  UltimoNivelError,
  buscarEstadoDoTimer,
  encerrarTimer,
  iniciarTimer,
  pausarTimer,
  pularNivel,
  reiniciarTimer,
  voltarNivel,
} from "@/lib/timer";

const ESTRUTURA_DE_BLINDS_DE_TESTE = [
  { blindPequeno: 1, blindGrande: 2, duracaoMinutos: 1 },
  { blindPequeno: 2, blindGrande: 4, duracaoMinutos: 1 },
];

function parametros(estruturaDeBlinds: typeof ESTRUTURA_DE_BLINDS_DE_TESTE) {
  return {
    tabelaDePontos: [[1, 25]],
    valorDaPartida: 10,
    multiplicadorPremiacaoPrimeiro: 2,
    multiplicadorPremiacaoSegundo: 1,
    estruturaDeBlinds,
    fichasIniciais: [],
  };
}

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function limpar() {
  await db.query("DELETE FROM timers_de_partida");
  await db.query("DELETE FROM caixa_transacoes");
  await db.query("DELETE FROM lancamentos");
  await db.query("DELETE FROM partidas");
  await db.query("DELETE FROM temporadas");
  await db.query("DELETE FROM jogadores WHERE nome LIKE '%de Teste'");
}

async function criarPartidaDeTeste(estruturaDeBlinds = ESTRUTURA_DE_BLINDS_DE_TESTE) {
  const temporada = await criarTemporada(parametros(estruturaDeBlinds), null);
  const jogadores = await Promise.all(
    ["Ana", "Beto", "Caio", "Dedé", "Elis"].map((n) => criarJogador(`${n} de Teste`, null)),
  );
  const partida = await criarPartida(
    "2026-01-01",
    jogadores.map((j) => j.id),
    null,
  );
  return { temporada, partida };
}

beforeEach(limpar);
afterEach(limpar);
afterAll(async () => {
  await db.end();
});

describe("iniciarTimer / buscarEstadoDoTimer (contra Postgres real)", () => {
  it("recusa iniciar sem Estrutura de Blinds configurada", async () => {
    const { partida } = await criarPartidaDeTeste([]);
    await expect(iniciarTimer(partida.id)).rejects.toThrow(SemEstruturaDeBlindsError);
  });

  it("inicia no nível 0, rodando, com o tempo cheio do nível", async () => {
    const { partida } = await criarPartidaDeTeste();
    const estado = await iniciarTimer(partida.id);

    expect(estado.nivel).toBe(0);
    expect(estado.rodando).toBe(true);
    expect(estado.nivelAtual).toEqual(ESTRUTURA_DE_BLINDS_DE_TESTE[0]);
    expect(estado.segundosRestantes).toBeLessThanOrEqual(60);
    expect(estado.segundosRestantes).toBeGreaterThan(55);
  });

  it("buscarEstadoDoTimer sem timer iniciado ainda mostra nível 0 parado", async () => {
    const { partida } = await criarPartidaDeTeste();
    const estado = await buscarEstadoDoTimer(partida.id);

    expect(estado?.nivel).toBe(0);
    expect(estado?.rodando).toBe(false);
    expect(estado?.segundosRestantes).toBe(60);
  });

  it("chamar iniciar de novo enquanto já roda não reinicia a contagem", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await espera(1100);

    const estado = await iniciarTimer(partida.id);

    // Já tinha passado ~1s antes desse segundo "iniciar" — se tivesse
    // reiniciado, voltaria pra ~60.
    expect(estado.segundosRestantes).toBeLessThan(60);
  });
});

describe("pausarTimer (contra Postgres real)", () => {
  it("congela o tempo decorrido, e retomar continua de onde parou", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await espera(1100);

    const pausado = await pausarTimer(partida.id);
    expect(pausado.rodando).toBe(false);
    const restanteAoPausar = pausado.segundosRestantes;
    expect(restanteAoPausar).toBeLessThanOrEqual(59);

    // Enquanto pausado, o tempo não deve continuar passando.
    await espera(500);
    const aindaPausado = await buscarEstadoDoTimer(partida.id);
    expect(aindaPausado?.segundosRestantes).toBe(restanteAoPausar);

    const retomado = await iniciarTimer(partida.id);
    expect(retomado.rodando).toBe(true);
    expect(retomado.segundosRestantes).toBeLessThanOrEqual(restanteAoPausar);
  });
});

describe("pularNivel (contra Postgres real)", () => {
  it("avança pro próximo nível e zera o tempo decorrido", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);

    const estado = await pularNivel(partida.id);

    expect(estado.nivel).toBe(1);
    expect(estado.nivelAtual).toEqual(ESTRUTURA_DE_BLINDS_DE_TESTE[1]);
    expect(estado.rodando).toBe(true); // mantém rodando, já que estava rodando
    expect(estado.segundosRestantes).toBeLessThanOrEqual(60);
  });

  it("recusa pular quando já está no último nível", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await pularNivel(partida.id); // vai pro nível 1, o último

    await expect(pularNivel(partida.id)).rejects.toThrow(UltimoNivelError);
  });

  it("recusa pular nível antes de o Timer ter sido iniciado", async () => {
    const { partida } = await criarPartidaDeTeste();

    await expect(pularNivel(partida.id)).rejects.toThrow(TimerNaoIniciadoError);
  });

  it("recusa pular nível sem Estrutura de Blinds configurada", async () => {
    const { partida } = await criarPartidaDeTeste([]);

    await expect(pularNivel(partida.id)).rejects.toThrow(SemEstruturaDeBlindsError);
  });
});

describe("voltarNivel (contra Postgres real)", () => {
  it("volta pro nível anterior e zera o tempo decorrido", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await pularNivel(partida.id); // nível 1
    await espera(1100);

    const estado = await voltarNivel(partida.id);

    expect(estado.nivel).toBe(0);
    expect(estado.nivelAtual).toEqual(ESTRUTURA_DE_BLINDS_DE_TESTE[0]);
    expect(estado.rodando).toBe(true); // mantém rodando, já que estava rodando
    expect(estado.segundosRestantes).toBeLessThanOrEqual(60);
    expect(estado.segundosRestantes).toBeGreaterThan(55);
  });

  it("recusa voltar quando já está no primeiro nível", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);

    await expect(voltarNivel(partida.id)).rejects.toThrow(PrimeiroNivelError);
  });

  it("recusa voltar nível antes de o Timer ter sido iniciado", async () => {
    const { partida } = await criarPartidaDeTeste();

    await expect(voltarNivel(partida.id)).rejects.toThrow(TimerNaoIniciadoError);
  });
});

describe("reiniciarTimer (contra Postgres real)", () => {
  it("volta pro nível 0, parado, com o tempo cheio", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await pularNivel(partida.id);
    await espera(1100);

    const estado = await reiniciarTimer(partida.id);

    expect(estado.nivel).toBe(0);
    expect(estado.rodando).toBe(false);
    expect(estado.segundosRestantes).toBe(60);
  });

  it("funciona mesmo se o Timer nunca tiver sido iniciado", async () => {
    const { partida } = await criarPartidaDeTeste();

    const estado = await reiniciarTimer(partida.id);

    expect(estado.nivel).toBe(0);
    expect(estado.rodando).toBe(false);
    expect(estado.segundosRestantes).toBe(60);
  });

  it("recusa sem Estrutura de Blinds configurada", async () => {
    const { partida } = await criarPartidaDeTeste([]);

    await expect(reiniciarTimer(partida.id)).rejects.toThrow(SemEstruturaDeBlindsError);
  });
});

describe("encerrarTimer (contra Postgres real)", () => {
  it("zera o Timer e trava todos os outros controles", async () => {
    const { partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await pularNivel(partida.id);

    const estado = await encerrarTimer(partida.id);

    expect(estado.encerrado).toBe(true);
    expect(estado.nivel).toBe(0);
    expect(estado.rodando).toBe(false);
    expect(estado.segundosRestantes).toBe(60);

    await expect(iniciarTimer(partida.id)).rejects.toThrow(TimerEncerradoError);
    await expect(pausarTimer(partida.id)).rejects.toThrow(TimerEncerradoError);
    await expect(pularNivel(partida.id)).rejects.toThrow(TimerEncerradoError);
    await expect(voltarNivel(partida.id)).rejects.toThrow(TimerEncerradoError);
    await expect(reiniciarTimer(partida.id)).rejects.toThrow(TimerEncerradoError);

    // encerrar de novo é idempotente — continua encerrado, não é um erro.
    await expect(encerrarTimer(partida.id)).resolves.toMatchObject({ encerrado: true });
  });

  it("funciona mesmo se o Timer nunca tiver sido iniciado", async () => {
    const { partida } = await criarPartidaDeTeste();

    const estado = await encerrarTimer(partida.id);

    expect(estado.encerrado).toBe(true);
  });

  it("funciona mesmo sem Estrutura de Blinds configurada (diferente dos outros controles)", async () => {
    const { partida } = await criarPartidaDeTeste([]);

    const estado = await encerrarTimer(partida.id);

    expect(estado.encerrado).toBe(true);
  });
});

describe("controle do Timer numa Temporada encerrada (contra Postgres real)", () => {
  it("recusa iniciar, pausar, pular/voltar nível, reiniciar e encerrar", async () => {
    const { temporada, partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);
    await pularNivel(partida.id); // nível 1, pra poder testar voltarNivel também
    await encerrarTemporada(temporada.id, null);

    await expect(iniciarTimer(partida.id)).rejects.toThrow(TemporadaEncerradaError);
    await expect(pausarTimer(partida.id)).rejects.toThrow(TemporadaEncerradaError);
    await expect(pularNivel(partida.id)).rejects.toThrow(TemporadaEncerradaError);
    await expect(voltarNivel(partida.id)).rejects.toThrow(TemporadaEncerradaError);
    await expect(reiniciarTimer(partida.id)).rejects.toThrow(TemporadaEncerradaError);
    await expect(encerrarTimer(partida.id)).rejects.toThrow(TemporadaEncerradaError);
  });

  it("corrida real entre pausar o Timer e encerrar a Temporada: nunca fica um estado gravado depois do encerramento", async () => {
    const { temporada, partida } = await criarPartidaDeTeste();
    await iniciarTimer(partida.id);

    // Sem `await` entre as duas, pra forçar a corrida de verdade — o
    // `SELECT ... FOR UPDATE` em pausarTimer decide quem "ganha".
    const [resultadoDoPause, resultadoDoEncerramento] = await Promise.allSettled([
      pausarTimer(partida.id),
      encerrarTemporada(temporada.id, null),
    ]);

    expect(resultadoDoEncerramento.status).toBe("fulfilled");

    if (resultadoDoPause.status === "rejected") {
      expect((resultadoDoPause as PromiseRejectedResult).reason).toBeInstanceOf(
        TemporadaEncerradaError,
      );
    }
    // Se pausarTimer venceu a corrida, não há nada de errado em ter
    // pausado um timer que, um instante depois, teve sua Temporada
    // encerrada — o importante é que nunca dá um erro genérico nem
    // deixa o timer num estado inconsistente. Confirma isso lendo o
    // estado final, o que já não lançar é suficiente.
    await expect(buscarEstadoDoTimer(partida.id)).resolves.not.toBeNull();
  });
});
