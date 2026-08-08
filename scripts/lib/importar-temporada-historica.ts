/**
 * Núcleo compartilhado dos scripts de importação de Temporadas antigas
 * (ver `.scratch/poker-tracker-v1/issues/24-importar-temporada-2026-1.md`
 * e os tickets seguintes) — extraído depois do 2º e 3º import pra não
 * triplicar a lógica de reconstrução de eliminações e gravação.
 *
 * Cada Temporada antiga tem seu próprio script fino (`import-temporada-*.ts`)
 * que só declara os dados (Partidas, Parâmetros, saídas manuais, totais
 * esperados pra validação) e chama `importarTemporadaHistorica`.
 */
import { Pool, type PoolClient } from "pg";

export interface ParticipanteImportado {
  nome: string;
  posicao: number;
  almas: number;
  pagamento: boolean;
}

export interface PartidaImportada {
  data: string;
  participantes: ParticipanteImportado[];
  /**
   * Valor exato da entrada no Caixa dessa Partida, quando a Temporada
   * usava um modelo de Premiação que `calcularEntradaNoCaixa` (multiplicador
   * fixo do Valor da Partida) não reproduz — ex: percentual do pote, que
   * varia com a quantidade de participantes. Quando informado, é usado
   * direto (o valor já vem certo da planilha); quando omitido, é
   * calculado a partir de `parametros`.
   */
  entradaNoCaixa?: number;
}

export interface ParametrosImportados {
  tabelaDePontos: [number, number][];
  valorDaPartida: number;
  multiplicadorPremiacaoPrimeiro: number;
  multiplicadorPremiacaoSegundo: number;
  estruturaDeBlinds: { blindPequeno: number; blindGrande: number; duracaoMinutos: number }[];
  fichasIniciais: { valor: number; quantidade: number }[];
}

export interface SaidaManualImportada {
  data: string;
  descricao: string;
  valor: number;
}

export interface ImportarTemporadaOpts {
  /** Só pra log/ticket — não grava em lugar nenhum. */
  rotulo: string;
  partidas: PartidaImportada[];
  parametros: ParametrosImportados;
  saidasManuais?: SaidaManualImportada[];
  /** Totais oficiais (aba AUX da planilha) — só validação, não gravado. */
  totaisEsperados: Record<string, { pontos: number; almas: number }>;
  dryRun: boolean;
}

/**
 * Reconstrói uma cadeia de eliminações fictícia pra uma Partida: quem
 * ficou em 1º/2º guarda a própria alma (não tem eliminador); todo mundo
 * abaixo disso precisa de exatamente 1 eliminador, tirado de um
 * "orçamento" de créditos = Almas registradas de cada um (descontado 1
 * de quem terminou em 1º/2º, já contado como a alma própria). Quando a
 * planilha tem uma inconsistência (soma de créditos ≠ nº de vítimas —
 * comum em temporadas mais antigas, onde muita eliminação ficava sem
 * registro de quem eliminou), o excedente é descartado e/ou vítimas
 * ficam sem eliminador (`eliminado_por_jogador_id = NULL`, o mesmo
 * "não sabemos quem eliminou" que o app já suporta — ver CONTEXT.md).
 */
export function reconstruirEliminacoes(participantes: ParticipanteImportado[]): {
  porNome: Map<string, string | null>;
  avisos: string[];
} {
  const avisos: string[] = [];
  const vitimas = participantes.filter((p) => p.posicao > 2).map((p) => p.nome);
  const creditos: string[] = [];
  for (const p of participantes) {
    const base = p.posicao <= 2 ? 1 : 0;
    // Clampado em 0: temporadas mais antigas às vezes registram um 1º/2º
    // com Alma abaixo de 1 (inconsistência de digitação da própria
    // planilha, não algo pra propagar como demanda negativa aqui).
    const demanda = Math.max(0, p.almas - base);
    for (let i = 0; i < demanda; i++) creditos.push(p.nome);
  }

  if (creditos.length > vitimas.length) {
    const excedente = creditos.length - vitimas.length;
    avisos.push(
      `excedente de ${excedente} crédito(s) de Alma sem vítima disponível — descartados`,
    );
    creditos.length = vitimas.length;
  } else if (creditos.length < vitimas.length) {
    const faltando = vitimas.length - creditos.length;
    avisos.push(
      `${faltando} vítima(s) sem crédito de Alma suficiente pra atribuir um eliminador — ficam sem eliminador`,
    );
  }

  function tentarEmparelhar(ordemDosCreditos: string[]): {
    porNome: Map<string, string | null>;
    semEliminador: number;
  } {
    const restantes = [...ordemDosCreditos];
    const resultado = new Map<string, string | null>();
    let semEliminador = 0;
    for (const vitima of vitimas) {
      const indice = restantes.findIndex((c) => c !== vitima);
      if (indice === -1) {
        resultado.set(vitima, null);
        if (restantes.length > 0) semEliminador++;
        continue;
      }
      resultado.set(vitima, restantes[indice]);
      restantes.splice(indice, 1);
    }
    return { porNome: resultado, semEliminador };
  }

  let melhor = tentarEmparelhar(creditos);
  for (let rotacao = 1; rotacao < creditos.length && melhor.semEliminador > 0; rotacao++) {
    const candidato = tentarEmparelhar([
      ...creditos.slice(rotacao),
      ...creditos.slice(0, rotacao),
    ]);
    if (candidato.semEliminador < melhor.semEliminador) melhor = candidato;
  }

  if (melhor.semEliminador > 0) {
    avisos.push(
      `${melhor.semEliminador} vítima(s) só tinham crédito de si mesmas disponível em qualquer ordem tentada — ficam sem eliminador`,
    );
  }

  return { porNome: melhor.porNome, avisos };
}

export async function importarTemporadaHistorica(opts: ImportarTemporadaOpts): Promise<void> {
  const { rotulo, partidas, parametros, saidasManuais = [], totaisEsperados, dryRun } = opts;

  if (!process.env.DATABASE_URL) {
    console.error("Defina DATABASE_URL antes de rodar.");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM temporadas FOR UPDATE");

    const nomesUnicos = [...new Set(partidas.flatMap((p) => p.participantes.map((x) => x.nome)))];
    const idsPorNome = new Map<string, number>();
    for (const nome of nomesUnicos) {
      const { rows } = await client.query<{ id: number }>(
        `SELECT id FROM jogadores WHERE nome ILIKE $1`,
        [nome],
      );
      if (rows.length > 1) {
        throw new Error(
          `Mais de um Jogador chamado "${nome}" já existe (ids: ${rows.map((r) => r.id).join(", ")}) — resolva a ambiguidade manualmente antes de importar.`,
        );
      }
      if (rows.length === 1) {
        idsPorNome.set(nome, rows[0].id);
      } else {
        const inserted = await client.query<{ id: number }>(
          `INSERT INTO jogadores (nome, ativo) VALUES ($1, true) RETURNING id`,
          [nome],
        );
        idsPorNome.set(nome, inserted.rows[0].id);
      }
    }
    console.log(`[${rotulo}] Jogadores (nome -> id):`, Object.fromEntries(idsPorNome));

    const primeiraData = partidas[0].data;
    const ultimaData = partidas[partidas.length - 1].data;

    const temporadaResult = await client.query<{ id: number }>(
      `INSERT INTO temporadas
         (aberta, data_inicio, data_fim, tabela_de_pontos, valor_da_partida,
          multiplicador_premiacao_primeiro, multiplicador_premiacao_segundo,
          estrutura_de_blinds, fichas_iniciais)
       VALUES (false, $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        primeiraData,
        ultimaData,
        JSON.stringify(parametros.tabelaDePontos),
        parametros.valorDaPartida,
        parametros.multiplicadorPremiacaoPrimeiro,
        parametros.multiplicadorPremiacaoSegundo,
        JSON.stringify(parametros.estruturaDeBlinds),
        JSON.stringify(parametros.fichasIniciais),
      ],
    );
    const temporadaId = temporadaResult.rows[0].id;
    console.log(`[${rotulo}] Temporada ${temporadaId} criada (encerrada, ${primeiraData} a ${ultimaData}).`);

    const totalPorJogador = new Map<string, { pontos: number; almas: number }>();
    const avisosGerais: string[] = [];

    function registrarAlma(nome: string) {
      const atual = totalPorJogador.get(nome) ?? { pontos: 0, almas: 0 };
      atual.almas += 1;
      totalPorJogador.set(nome, atual);
    }

    for (const partida of partidas) {
      const { porNome, avisos } = reconstruirEliminacoes(partida.participantes);
      if (avisos.length > 0) avisosGerais.push(`${partida.data}: ${avisos.join("; ")}`);

      const partidaResult = await client.query<{ id: number }>(
        `INSERT INTO partidas (temporada_id, data, finalizada) VALUES ($1, $2, true) RETURNING id`,
        [temporadaId, partida.data],
      );
      const partidaId = partidaResult.rows[0].id;

      for (const p of partida.participantes) {
        const jogadorId = idsPorNome.get(p.nome)!;
        const eliminadorNome = porNome.get(p.nome) ?? null;
        const eliminadorId = eliminadorNome ? (idsPorNome.get(eliminadorNome) ?? null) : null;

        await client.query(
          `INSERT INTO lancamentos (partida_id, jogador_id, posicao, eliminado_por_jogador_id, pagamento)
           VALUES ($1, $2, $3, $4, $5)`,
          [partidaId, jogadorId, p.posicao, eliminadorId, p.pagamento],
        );

        const pontosDaPosicao =
          parametros.tabelaDePontos.find(([pos]) => pos === p.posicao)?.[1] ?? 0;
        const atual = totalPorJogador.get(p.nome) ?? { pontos: 0, almas: 0 };
        atual.pontos += pontosDaPosicao;
        totalPorJogador.set(p.nome, atual);

        if (p.posicao <= 2) registrarAlma(p.nome);
        if (eliminadorNome) registrarAlma(eliminadorNome);
      }

      const entrada =
        partida.entradaNoCaixa ??
        partida.participantes.length * parametros.valorDaPartida -
          parametros.valorDaPartida *
            (parametros.multiplicadorPremiacaoPrimeiro + parametros.multiplicadorPremiacaoSegundo);
      await client.query(
        `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, data, partida_id)
         VALUES ($1, 'entrada_partida', $2, $3, $4)`,
        [temporadaId, entrada, partida.data, partidaId],
      );
    }

    for (const saida of saidasManuais) {
      await client.query(
        `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, data, descricao)
         VALUES ($1, 'saida_manual', $2, $3, $4)`,
        [temporadaId, saida.valor, saida.data, saida.descricao],
      );
    }

    const { rows: almasReais } = await client.query<{ nome: string; almas: string }>(
      `SELECT j.nome, COUNT(l.id) AS almas
       FROM jogadores j
       JOIN lancamentos l ON l.eliminado_por_jogador_id = j.id
       JOIN partidas pa ON pa.id = l.partida_id
       WHERE pa.temporada_id = $1
       GROUP BY j.nome`,
      [temporadaId],
    );
    const almasPorEliminacao = new Map(almasReais.map((r) => [r.nome, Number(r.almas)]));

    console.log(`\n=== [${rotulo}] Relatório de validação ===`);
    for (const [nome, esperado] of Object.entries(totaisEsperados)) {
      const calc = totalPorJogador.get(nome) ?? { pontos: 0, almas: 0 };
      const pontosTotais = calc.pontos + calc.almas;
      const ok = pontosTotais === esperado.pontos && calc.almas === esperado.almas;
      console.log(
        `${nome.padEnd(10)} pontos: ${pontosTotais} (esperado ${esperado.pontos})  almas: ${calc.almas} (esperado ${esperado.almas})  ${ok ? "OK" : "DIVERGE"}`,
      );
    }

    let inconsistenciaDeGravacao = false;
    for (const [nome, calc] of totalPorJogador) {
      const eliminacoesGravadas = almasPorEliminacao.get(nome) ?? 0;
      const eliminacoesEsperadas =
        calc.almas -
        partidas.filter((p) => p.participantes.some((x) => x.nome === nome && x.posicao <= 2))
          .length;
      if (eliminacoesGravadas !== eliminacoesEsperadas) {
        inconsistenciaDeGravacao = true;
        console.log(
          `INCONSISTÊNCIA DE GRAVAÇÃO: ${nome} — eliminações no banco=${eliminacoesGravadas}, esperado=${eliminacoesEsperadas}`,
        );
      }
    }
    if (!inconsistenciaDeGravacao) {
      console.log("(checagem cruzada com o banco: grafo de eliminações gravado bate com o esperado)");
    }

    if (avisosGerais.length > 0) {
      console.log(`\n=== [${rotulo}] Avisos (Partidas com inconsistência na planilha original) ===`);
      avisosGerais.forEach((a) => console.log("- " + a));
    }

    if (dryRun) {
      await client.query("ROLLBACK");
      console.log(`\n[${rotulo}] --dry-run: nada foi gravado (ROLLBACK).`);
    } else {
      await client.query("COMMIT");
      console.log(`\n[${rotulo}] Importado com sucesso — Temporada ${temporadaId}, ${partidas.length} Partidas.`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
