/**
 * Importa a Temporada 2024.2 (ago–dez/2024), registrada numa planilha
 * Google Sheets separada (formato mais antigo, diferente das duas
 * planilhas locais já importadas — ver ticket 27). Mesmo padrão dos
 * tickets 24/26: grava como Temporada já encerrada, sem mexer na
 * Temporada aberta.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/import-temporada-2024-2.ts [--dry-run]
 */
import { importarTemporadaHistorica, type PartidaImportada } from "./lib/importar-temporada-historica";

const DRY_RUN = process.argv.includes("--dry-run");

const PARTIDAS: PartidaImportada[] = [
  { data: "2024-08-06", entradaNoCaixa: 10, participantes: [{ nome: "Mica", posicao: 3, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 2, pagamento: true }, { nome: "Galego", posicao: 3, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }] },
  { data: "2024-08-13", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 4, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 3, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Turati", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 1, almas: 2, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-08-20", entradaNoCaixa: 12, participantes: [{ nome: "Felipe", posicao: 3, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 1, pagamento: true }, { nome: "Nino", posicao: 1, almas: 1, pagamento: true }, { nome: "Galego", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2024-08-27", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 1, almas: 4, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 5, almas: 0, pagamento: true }, { nome: "Galego", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 4, almas: 0, pagamento: true }] },
  { data: "2024-09-03", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 0, pagamento: true }, { nome: "Galego", posicao: 5, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 2, pagamento: true }, { nome: "Carlos", posicao: 1, almas: 2, pagamento: true }] },
  { data: "2024-09-10", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 2, pagamento: true }, { nome: "Nino", posicao: 6, almas: 2, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Turati", posicao: 2, almas: 2, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2024-09-17", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 4, pagamento: true }, { nome: "Galego", posicao: 2, almas: 1, pagamento: true }, { nome: "Turati", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 5, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-09-24", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 3, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 4, pagamento: true }, { nome: "Nino", posicao: 1, almas: 1, pagamento: true }, { nome: "Galego", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 8, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-10-01", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 2, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 5, almas: 2, pagamento: true }, { nome: "Turati", posicao: 2, almas: 2, pagamento: true }, { nome: "Enio", posicao: 3, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-10-08", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Galego", posicao: 4, almas: 1, pagamento: true }, { nome: "Turati", posicao: 2, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-10-15", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 4, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 2, pagamento: true }, { nome: "Nino", posicao: 5, almas: 0, pagamento: true }, { nome: "Galego", posicao: 4, almas: 1, pagamento: true }, { nome: "Turati", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2024-10-22", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 5, almas: 3, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 3, almas: 1, pagamento: true }, { nome: "Galego", posicao: 1, almas: 2, pagamento: true }, { nome: "Turati", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 10, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 2, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2024-10-29", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 4, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 2, pagamento: true }, { nome: "Galego", posicao: 7, almas: 0, pagamento: true }, { nome: "Turati", posicao: 2, almas: 1, pagamento: true }, { nome: "Enio", posicao: 3, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-11-05", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 2, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 3, pagamento: true }, { nome: "Turati", posicao: 3, almas: 0, pagamento: true }, { nome: "Enio", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-11-12", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 1, almas: 5, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 8, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 2, almas: 1, pagamento: true }, { nome: "Turati", posicao: 6, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2024-11-19", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 5, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 4, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 9, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2024-11-26", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 1, almas: 3, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 6, almas: 0, pagamento: true }, { nome: "Turati", posicao: 2, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 2, pagamento: true }] },
  { data: "2024-12-03", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 10, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 1, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Galego", posicao: 2, almas: 0, pagamento: true }, { nome: "Turati", posicao: 1, almas: 4, pagamento: true }, { nome: "Enio", posicao: 4, almas: 2, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-12-10", entradaNoCaixa: 22, participantes: [{ nome: "Mica", posicao: 1, almas: 6, pagamento: true }, { nome: "Felipe", posicao: 7, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 8, almas: 0, pagamento: true }, { nome: "Nino", posicao: 11, almas: 0, pagamento: true }, { nome: "Galego", posicao: 5, almas: 0, pagamento: true }, { nome: "Turati", posicao: 3, almas: 1, pagamento: true }, { nome: "Enio", posicao: 9, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 10, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 4, almas: 0, pagamento: true }] },
];

// Premiação real dessa Temporada era 50%/30% do pote da Partida (que
// varia com QTDE de participantes) — não redutível a um multiplicador
// fixo do Valor da Partida, o modelo que o app usa hoje. Os campos abaixo
// ficam 0 (não representativos, não usados: cada `entradaNoCaixa` acima
// já veio pronto da planilha) — só existem porque a coluna é NOT NULL.
importarTemporadaHistorica({
  rotulo: "2024.2",
  partidas: PARTIDAS,
  parametros: {
    tabelaDePontos: [
      [1, 23], [2, 17], [3, 12], [4, 8], [5, 5], [6, 3], [7, 2],
      [8, 1], [9, 1], [10, 1], [11, 1], [12, 1],
    ],
    valorDaPartida: 10,
    multiplicadorPremiacaoPrimeiro: 0,
    multiplicadorPremiacaoSegundo: 0,
    estruturaDeBlinds: [
      { blindPequeno: 20, blindGrande: 40, duracaoMinutos: 20 },
      { blindPequeno: 25, blindGrande: 50, duracaoMinutos: 20 },
      { blindPequeno: 40, blindGrande: 80, duracaoMinutos: 20 },
      { blindPequeno: 50, blindGrande: 100, duracaoMinutos: 20 },
      { blindPequeno: 100, blindGrande: 200, duracaoMinutos: 20 },
      { blindPequeno: 150, blindGrande: 300, duracaoMinutos: 20 },
      { blindPequeno: 250, blindGrande: 500, duracaoMinutos: 20 },
      { blindPequeno: 500, blindGrande: 1000, duracaoMinutos: 15 },
      { blindPequeno: 750, blindGrande: 1500, duracaoMinutos: 15 },
      { blindPequeno: 1000, blindGrande: 2000, duracaoMinutos: 15 },
      { blindPequeno: 1500, blindGrande: 3000, duracaoMinutos: 15 },
      { blindPequeno: 2000, blindGrande: 4000, duracaoMinutos: 15 },
      { blindPequeno: 2500, blindGrande: 5000, duracaoMinutos: 15 },
      { blindPequeno: 3000, blindGrande: 6000, duracaoMinutos: 15 },
      { blindPequeno: 5000, blindGrande: 10000, duracaoMinutos: 15 },
    ],
    fichasIniciais: [
      { valor: 10, quantidade: 10 },
      { valor: 25, quantidade: 8 },
      { valor: 50, quantidade: 8 },
      { valor: 100, quantidade: 8 },
      { valor: 500, quantidade: 2 },
      { valor: 1000, quantidade: 2 },
      { valor: 5000, quantidade: 1 },
    ],
  },
  saidasManuais: [
    {
      data: "2024-12-03",
      descricao: "Quebra de caixa — sumiu a grana durante o semestre",
      valor: 23,
    },
  ],
  totaisEsperados: {
    Edinho: { pontos: 198, almas: 14 },
    Mica: { pontos: 193, almas: 26 },
    Felipe: { pontos: 171, almas: 18 },
    Galego: { pontos: 170, almas: 13 },
    Turati: { pontos: 159, almas: 11 },
    Sergio: { pontos: 148, almas: 7 },
    Danilo: { pontos: 148, almas: 8 },
    Nino: { pontos: 133, almas: 11 },
    Enio: { pontos: 82, almas: 5 },
    Carlos: { pontos: 54, almas: 5 },
    Ueda: { pontos: 20, almas: 0 },
  },
  dryRun: DRY_RUN,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
