/**
 * Importa a Temporada 2026.1 (fev–jun/2026), hoje só registrada em
 * `POKER 1_2026.xlsx`, como uma Temporada já ENCERRADA no banco — pra
 * aparecer no Histórico sem mexer na Temporada aberta atual.
 *
 * Roda fora do fluxo normal da API (que só permite uma Temporada aberta
 * por vez e sempre cria a Temporada já aberta) porque isso é
 * especificamente um backfill histórico: grava direto via SQL, dentro de
 * uma única transação (tudo ou nada).
 *
 * IMPORTANTE — limitação conhecida e assumida (ver `.scratch/poker-tracker-v1/
 * issues/24-importar-temporada-2026-1.md`): a planilha não registra quem
 * eliminou quem, só o total de Almas de cada Jogador por Partida. O
 * schema atual deriva Almas do grafo de eliminação (`eliminado_por_jogador_id`),
 * não aceita um número solto. Pra não perder os dados de Almas (e o
 * Ranking Carrasco) desta Temporada, este script RECONSTRÓI uma cadeia de
 * eliminações fictícia por Partida que reproduz os totais de Almas reais
 * da planilha — não é quem eliminou quem de verdade. Isso é sinalizado
 * explicitamente na `descricao`... na verdade não há campo pra isso em
 * Partida; documentado aqui e na UI (ver ticket 24) com um aviso na
 * página da Temporada.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/import-temporada-2026-1.ts [--dry-run]
 *
 * `--dry-run` faz todo o cálculo e a validação, imprime o relatório, mas
 * dá ROLLBACK no final em vez de COMMIT — nada é gravado.
 */
import { Pool } from "pg";
import { calcularEntradaNoCaixa, calcularPremiacaoDaPartida } from "../src/domain/caixa";

const DRY_RUN = process.argv.includes("--dry-run");

const TABELA_DE_PONTOS: [number, number][] = [
  [1, 25],
  [2, 18],
  [3, 15],
  [4, 12],
  [5, 10],
  [6, 8],
  [7, 6],
  [8, 4],
  [9, 2],
  [10, 1],
  [11, 1],
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
];

const PARAMETROS = {
  tabelaDePontos: TABELA_DE_PONTOS,
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
  // Níveis/horários exatamente como registrados na planilha (aba
  // PONTUACAO, bloco PARAMETROS) — o último nível ("24:00:00") não tem
  // duração real registrada, então reaproveita os 20min dos anteriores.
  estruturaDeBlinds: [
    { blindPequeno: 50, blindGrande: 100, duracaoMinutos: 20 },
    { blindPequeno: 100, blindGrande: 200, duracaoMinutos: 20 },
    { blindPequeno: 150, blindGrande: 300, duracaoMinutos: 20 },
    { blindPequeno: 200, blindGrande: 400, duracaoMinutos: 20 },
    { blindPequeno: 300, blindGrande: 600, duracaoMinutos: 20 },
    { blindPequeno: 500, blindGrande: 1000, duracaoMinutos: 20 },
    { blindPequeno: 750, blindGrande: 1500, duracaoMinutos: 20 },
    { blindPequeno: 1000, blindGrande: 2000, duracaoMinutos: 20 },
    { blindPequeno: 1500, blindGrande: 3000, duracaoMinutos: 20 },
    { blindPequeno: 2000, blindGrande: 4000, duracaoMinutos: 20 },
    { blindPequeno: 2500, blindGrande: 5000, duracaoMinutos: 20 },
    { blindPequeno: 3000, blindGrande: 6000, duracaoMinutos: 20 },
    { blindPequeno: 5000, blindGrande: 10000, duracaoMinutos: 20 },
  ],
  fichasIniciais: [{ valor: 10000, quantidade: 1 }],
};

interface ParticipanteImportado {
  nome: string;
  posicao: number;
  almas: number;
  pagamento: boolean;
}

interface PartidaImportada {
  data: string;
  participantes: ParticipanteImportado[];
}

// Gerado a partir de `POKER 1_2026.xlsx` (aba PONTUACAO) — ver
// `.scratch/poker-tracker-v1/stitch-prompt.md`... na verdade ver o
// ticket 24 pra como isso foi extraído (LibreOffice --convert-to csv +
// parser Python, com validação linha a linha contra os totais da aba AUX).
const PARTIDAS: PartidaImportada[] = [
  { data: "2026-02-03", participantes: [{ nome: "Sergio", posicao: 1, almas: 5, pagamento: true }, { nome: "Felipe", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 2, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2026-02-10", participantes: [{ nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 3, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 3, pagamento: true }, { nome: "Nino", posicao: 5, almas: 1, pagamento: true }, { nome: "Carlão", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 3, pagamento: true }] },
  { data: "2026-02-24", participantes: [{ nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 2, pagamento: true }, { nome: "Nino", posicao: 4, almas: 0, pagamento: true }, { nome: "Grande", posicao: 8, almas: 1, pagamento: true }, { nome: "Enio", posicao: 3, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }, { nome: "Turati", posicao: 2, almas: 2, pagamento: true }] },
  { data: "2026-03-03", participantes: [{ nome: "Sergio", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 3, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 4, almas: 0, pagamento: true }, { nome: "Grande", posicao: 3, almas: 3, pagamento: true }, { nome: "Enio", posicao: 1, almas: 3, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2026-03-10", participantes: [{ nome: "Sergio", posicao: 1, almas: 4, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 1, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 6, almas: 1, pagamento: true }, { nome: "Grande", posicao: 5, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 3, pagamento: true }] },
  { data: "2026-03-17", participantes: [{ nome: "Sergio", posicao: 2, almas: 5, pagamento: true }, { nome: "Felipe", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 6, almas: 0, pagamento: true }, { nome: "Grande", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 1, almas: 2, pagamento: true }] },
  { data: "2026-03-24", participantes: [{ nome: "Sergio", posicao: 1, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: false }, { nome: "Edinho", posicao: 4, almas: 1, pagamento: false }, { nome: "Nino", posicao: 2, almas: 3, pagamento: true }, { nome: "Grande", posicao: 3, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2026-03-31", participantes: [{ nome: "Felipe", posicao: 3, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 5, pagamento: true }, { nome: "Carlão", posicao: 7, almas: 0, pagamento: true }, { nome: "Grande", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 2, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 4, almas: 0, pagamento: true }] },
  { data: "2026-04-07", participantes: [{ nome: "Sergio", posicao: 3, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 3, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 2, pagamento: true }, { nome: "Carlão", posicao: 2, almas: 2, pagamento: true }, { nome: "Grande", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 7, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2026-04-14", participantes: [{ nome: "Sergio", posicao: 1, almas: 3, pagamento: false }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 1, pagamento: false }, { nome: "Nino", posicao: 2, almas: 4, pagamento: true }, { nome: "Carlão", posicao: 7, almas: 0, pagamento: true }, { nome: "Grande", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: false }] },
  { data: "2026-04-28", participantes: [{ nome: "Sergio", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 1, pagamento: true }, { nome: "Nino", posicao: 1, almas: 4, pagamento: true }, { nome: "Carlão", posicao: 3, almas: 2, pagamento: true }, { nome: "Grande", posicao: 6, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2026-05-05", participantes: [{ nome: "Sergio", posicao: 2, almas: 3, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 4, pagamento: true }, { nome: "Edinho", posicao: 9, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 1, pagamento: true }, { nome: "Carlão", posicao: 3, almas: 0, pagamento: true }, { nome: "Grande", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 7, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 1, pagamento: true }] },
  { data: "2026-05-12", participantes: [{ nome: "Sergio", posicao: 3, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 6, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 3, pagamento: false }, { nome: "Nino", posicao: 2, almas: 2, pagamento: true }, { nome: "Carlão", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 8, almas: 0, pagamento: true }, { nome: "Alexandre", posicao: 5, almas: 1, pagamento: true }] },
  { data: "2026-05-19", participantes: [{ nome: "Sergio", posicao: 6, almas: 0, pagamento: false }, { nome: "Felipe", posicao: 1, almas: 3, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 1, pagamento: true }, { nome: "Nino", posicao: 5, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 4, almas: 2, pagamento: false }, { nome: "Grande", posicao: 3, almas: 2, pagamento: true }, { nome: "Enio", posicao: 8, almas: 0, pagamento: true }, { nome: "Alexandre", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2026-05-26", participantes: [{ nome: "Sergio", posicao: 5, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 3, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 2, pagamento: true }, { nome: "Alexandre", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2026-06-02", participantes: [{ nome: "Sergio", posicao: 1, almas: 4, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 2, almas: 3, pagamento: true }, { nome: "Carlão", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 5, almas: 2, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 4, almas: 0, pagamento: true }] },
  { data: "2026-06-09", participantes: [{ nome: "Sergio", posicao: 3, almas: 0, pagamento: false }, { nome: "Felipe", posicao: 2, almas: 4, pagamento: false }, { nome: "Danilo", posicao: 5, almas: 1, pagamento: false }, { nome: "Edinho", posicao: 1, almas: 3, pagamento: false }, { nome: "Nino", posicao: 4, almas: 0, pagamento: false }, { nome: "Carlão", posicao: 6, almas: 0, pagamento: false }, { nome: "Grande", posicao: 7, almas: 0, pagamento: false }, { nome: "Alexandre", posicao: 8, almas: 0, pagamento: false }] },
];

const SAIDA_MANUAL = {
  data: "2026-02-04",
  descricao: "Compra de baralho novo",
  valor: 39.0,
};

// Totais oficiais da aba AUX, só pra validação (não usados na gravação).
const TOTAIS_ESPERADOS: Record<string, { pontos: number; almas: number }> = {
  Sergio: { pontos: 279, almas: 29 },
  Danilo: { pontos: 255, almas: 18 },
  Nino: { pontos: 233, almas: 25 },
  Edinho: { pontos: 223, almas: 17 },
  Ueda: { pontos: 184, almas: 11 },
  Felipe: { pontos: 170, almas: 14 },
  Enio: { pontos: 165, almas: 9 },
  Carlão: { pontos: 133, almas: 7 },
  Grande: { pontos: 129, almas: 8 },
  Alexandre: { pontos: 27, almas: 1 },
  Turati: { pontos: 20, almas: 2 },
};

/**
 * Reconstrói uma cadeia de eliminações fictícia pra uma Partida: quem
 * ficou em 1º/2º guarda a própria alma (não tem eliminador); todo mundo
 * abaixo disso precisa de exatamente 1 eliminador. O "orçamento" de
 * quantas eliminações cada Jogador pode ser credidato vem de
 * `almas - (1 se 1º/2º)`. Quando a planilha tem uma inconsistência (soma
 * de créditos ≠ nº de vítimas — aconteceu em 3 das 17 Partidas, ver
 * ticket 24), o excedente é descartado (créditos em excesso) ou deixado
 * sem eliminador (vítimas que sobraram) — nos dois casos a Alma daquela
 * pessoa fica levemente abaixo do registrado na planilha só naquela
 * Partida específica, e o script avisa no relatório final.
 */
function reconstruirEliminacoes(participantes: ParticipanteImportado[]): {
  porNome: Map<string, string | null>;
  avisos: string[];
} {
  const avisos: string[] = [];
  const vitimas = participantes.filter((p) => p.posicao > 2).map((p) => p.nome);
  const creditos: string[] = [];
  for (const p of participantes) {
    const base = p.posicao <= 2 ? 1 : 0;
    const demanda = p.almas - base;
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

  // Emparelha vítima <-> crédito evitando auto-eliminação (o schema
  // proíbe `eliminado_por_jogador_id = jogador_id` — é comum a mesma
  // pessoa aparecer como vítima E como fonte de crédito na mesma
  // Partida, já que ela pode ter eliminado gente antes de sair). Um
  // zip guloso simples (sempre pegando o primeiro crédito válido) pode
  // travar mais tarde mesmo quando existe um emparelhamento válido —
  // tenta várias ordens embaralhadas (determinístico, sem depender de
  // Math.random) e fica com a que sobrar menos vítima sem eliminador.
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

  // "Embaralha" de um jeito simples e determinístico: roda a lista de
  // créditos (rotação), tentando cada ponto de partida possível.
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

async function main() {
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Trava enquanto roda — evita pisar numa Temporada sendo aberta/fechada
    // ao mesmo tempo por alguém usando o app.
    await client.query("SELECT id FROM temporadas FOR UPDATE");

    const nomesUnicos = [...new Set(PARTIDAS.flatMap((p) => p.participantes.map((x) => x.nome)))];
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
    console.log("Jogadores (nome -> id):", Object.fromEntries(idsPorNome));

    const primeiraData = PARTIDAS[0].data;
    const ultimaData = PARTIDAS[PARTIDAS.length - 1].data;

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
        JSON.stringify(PARAMETROS.tabelaDePontos),
        PARAMETROS.valorDaPartida,
        PARAMETROS.multiplicadorPremiacaoPrimeiro,
        PARAMETROS.multiplicadorPremiacaoSegundo,
        JSON.stringify(PARAMETROS.estruturaDeBlinds),
        JSON.stringify(PARAMETROS.fichasIniciais),
      ],
    );
    const temporadaId = temporadaResult.rows[0].id;
    console.log(`Temporada ${temporadaId} criada (encerrada, ${primeiraData} a ${ultimaData}).`);

    const totalPorJogador = new Map<string, { pontos: number; almas: number }>();
    const avisosGerais: string[] = [];

    for (const partida of PARTIDAS) {
      const { porNome, avisos } = reconstruirEliminacoes(partida.participantes);
      if (avisos.length > 0) {
        avisosGerais.push(`${partida.data}: ${avisos.join("; ")}`);
      }

      const partidaResult = await client.query<{ id: number }>(
        `INSERT INTO partidas (temporada_id, data, finalizada) VALUES ($1, $2, true) RETURNING id`,
        [temporadaId, partida.data],
      );
      const partidaId = partidaResult.rows[0].id;

      function registrarAlma(nome: string) {
        const atual = totalPorJogador.get(nome) ?? { pontos: 0, almas: 0 };
        atual.almas += 1;
        totalPorJogador.set(nome, atual);
      }

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
          PARAMETROS.tabelaDePontos.find(([pos]) => pos === p.posicao)?.[1] ?? 0;
        const atual = totalPorJogador.get(p.nome) ?? { pontos: 0, almas: 0 };
        atual.pontos += pontosDaPosicao;
        totalPorJogador.set(p.nome, atual);

        // Alma = derivado do MESMO grafo gravado (`eliminado_por_jogador_id`,
        // igual ao app faz de verdade em `calcularAlmas`) — não do total
        // original da planilha. 1º/2º guardam a própria alma; quem eliminou
        // alguém é creditado na hora (`registrarAlma` no eliminador, não na
        // vítima).
        if (p.posicao <= 2) registrarAlma(p.nome);
        if (eliminadorNome) registrarAlma(eliminadorNome);
      }

      const premiacao = calcularPremiacaoDaPartida(PARAMETROS);
      const entrada = calcularEntradaNoCaixa(partida.participantes.length, PARAMETROS);
      await client.query(
        `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, data, partida_id)
         VALUES ($1, 'entrada_partida', $2, $3, $4)`,
        [temporadaId, entrada, partida.data, partidaId],
      );
      void premiacao;
    }

    // Confere o grafo realmente gravado no banco (não o que a
    // reconstrução pretendia) contra a mesma consulta que
    // `calcularRankingsDaTemporada` faria de verdade — dupla checagem
    // independente do `totalPorJogador` calculado em memória acima.
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

    await client.query(
      `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, data, descricao)
       VALUES ($1, 'saida_manual', $2, $3, $4)`,
      [temporadaId, SAIDA_MANUAL.valor, SAIDA_MANUAL.data, SAIDA_MANUAL.descricao],
    );

    console.log("\n=== Relatório de validação (pontos de posição + Almas reconstruídas) ===");
    let algumaDivergencia = false;
    for (const [nome, esperado] of Object.entries(TOTAIS_ESPERADOS)) {
      const calc = totalPorJogador.get(nome) ?? { pontos: 0, almas: 0 };
      const pontosTotais = calc.pontos + calc.almas;
      const ok = pontosTotais === esperado.pontos && calc.almas === esperado.almas;
      if (!ok) algumaDivergencia = true;
      console.log(
        `${nome.padEnd(10)} pontos: ${pontosTotais} (esperado ${esperado.pontos})  almas: ${calc.almas} (esperado ${esperado.almas})  ${ok ? "OK" : "DIVERGE"}`,
      );
    }

    // Checagem cruzada: soma de eliminações gravadas no banco (via
    // `eliminado_por_jogador_id`, a mesma consulta que o app faz de
    // verdade) tem que bater com o que ficou registrado em memória acima
    // menos o +1 de quem terminou em 1º/2º.
    let inconsistenciaDeGravacao = false;
    for (const [nome, calc] of totalPorJogador) {
      const eliminacoesGravadas = almasPorEliminacao.get(nome) ?? 0;
      const eliminacoesEsperadas =
        calc.almas -
        PARTIDAS.filter((p) => p.participantes.some((x) => x.nome === nome && x.posicao <= 2))
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
      console.log("\n=== Avisos (Partidas com inconsistência na planilha original) ===");
      avisosGerais.forEach((a) => console.log("- " + a));
    }

    if (DRY_RUN) {
      await client.query("ROLLBACK");
      console.log("\n--dry-run: nada foi gravado (ROLLBACK).");
    } else {
      await client.query("COMMIT");
      console.log(`\nImportado com sucesso — Temporada ${temporadaId}, ${PARTIDAS.length} Partidas.`);
    }

    if (algumaDivergencia && !DRY_RUN) {
      console.warn(
        "\nATENÇÃO: alguns totais divergiram (esperado, dadas as inconsistências avisadas acima) — já foi commitado, revise o relatório.",
      );
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
