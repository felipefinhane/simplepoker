/**
 * Importa a Temporada 2025.2 (ago–out/2025, `POKER 02_2025.xlsx`). Mesmo
 * padrão dos tickets 24/26/27 — Temporada já encerrada, sem mexer na
 * Temporada aberta.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/import-temporada-2025-2.ts [--dry-run]
 */
import { importarTemporadaHistorica, type PartidaImportada } from "./lib/importar-temporada-historica";

const DRY_RUN = process.argv.includes("--dry-run");

const PARTIDAS: PartidaImportada[] = [
  { data: "2025-08-05", entradaNoCaixa: 24, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 3, almas: 3, pagamento: true }, { nome: "Enio", posicao: 1, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 0, pagamento: true }, { nome: "Chico", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2025-08-12", entradaNoCaixa: 24, participantes: [{ nome: "Danilo", posicao: 3, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 1, pagamento: true }, { nome: "Carlão", posicao: 1, almas: 1, pagamento: true }, { nome: "Enio", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Chico", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2025-08-19", entradaNoCaixa: 32, participantes: [{ nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 1, almas: 1, pagamento: true }, { nome: "Enio", posicao: 2, almas: 4, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }, { nome: "Chico", posicao: 3, almas: 1, pagamento: true }] },
  { data: "2025-08-26", entradaNoCaixa: 28, participantes: [{ nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 1, pagamento: true }, { nome: "Nino", posicao: 2, almas: 1, pagamento: true }, { nome: "Carlão", posicao: 3, almas: 0, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 1, almas: 3, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2025-09-02", entradaNoCaixa: 40, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 3, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 2, pagamento: true }, { nome: "Carlão", posicao: 5, almas: 0, pagamento: true }, { nome: "Enio", posicao: 2, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 10, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 4, almas: 3, pagamento: true }] },
  { data: "2025-09-09", entradaNoCaixa: 36, participantes: [{ nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 3, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 2, almas: 2, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 3, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2025-09-16", entradaNoCaixa: 40, participantes: [{ nome: "Mica", posicao: 1, almas: 4, pagamento: true }, { nome: "Felipe", posicao: 10, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 9, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 1, pagamento: true }, { nome: "Grande", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2025-09-23", entradaNoCaixa: 36, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 3, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 3, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 2, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 6, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 8, almas: 0, pagamento: true }, { nome: "Grande", posicao: 4, almas: 0, pagamento: true }] },
  { data: "2025-09-30", entradaNoCaixa: 36, participantes: [{ nome: "Mica", posicao: 3, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 8, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 4, pagamento: true }, { nome: "Carlão", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2025-10-07", entradaNoCaixa: 40, participantes: [{ nome: "Mica", posicao: 1, almas: 6, pagamento: true }, { nome: "Felipe", posicao: 3, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 8, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 1, pagamento: true }, { nome: "Nino", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 1, pagamento: true }, { nome: "Grande", posicao: 10, almas: 0, pagamento: true }] },
  { data: "2025-10-14", entradaNoCaixa: 36, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 2, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlão", posicao: 4, almas: 0, pagamento: true }, { nome: "Enio", posicao: 6, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 3, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2025-10-21", entradaNoCaixa: 40, participantes: [{ nome: "Mica", posicao: 6, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 3, pagamento: true }, { nome: "Nino", posicao: 1, almas: 3, pagamento: true }, { nome: "Carlão", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 5, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 0, pagamento: true }, { nome: "Grande", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2025-10-28", entradaNoCaixa: 40, participantes: [{ nome: "Mica", posicao: 10, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 9, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 2, pagamento: true }, { nome: "Carlão", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 2, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }, { nome: "Grande", posicao: 8, almas: 1, pagamento: true }] },
];

// Mesma ressalva do script da 2024.2: Premiação real dessa Temporada era
// 40%/20% do pote (varia com QTDE), não um multiplicador fixo — os
// campos abaixo não são usados (cada entradaNoCaixa já veio pronto da
// planilha), só preenchidos porque a coluna é NOT NULL.
importarTemporadaHistorica({
  rotulo: "2025.2",
  partidas: PARTIDAS,
  parametros: {
    tabelaDePontos: [
      [1, 23], [2, 17], [3, 12], [4, 8], [5, 5], [6, 3], [7, 2],
      [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1],
    ],
    valorDaPartida: 10,
    multiplicadorPremiacaoPrimeiro: 0,
    multiplicadorPremiacaoSegundo: 0,
    estruturaDeBlinds: [],
    fichasIniciais: [],
  },
  totaisEsperados: {
    Edinho: { pontos: 147, almas: 13 },
    Nino: { pontos: 132, almas: 12 },
    Carlão: { pontos: 123, almas: 7 },
    Enio: { pontos: 112, almas: 10 },
    Sergio: { pontos: 107, almas: 7 },
    Danilo: { pontos: 93, almas: 7 },
    Mica: { pontos: 86, almas: 12 },
    Ueda: { pontos: 86, almas: 8 },
    Felipe: { pontos: 82, almas: 7 },
    Grande: { pontos: 31, almas: 4 },
    Chico: { pontos: 19, almas: 1 },
  },
  dryRun: DRY_RUN,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
