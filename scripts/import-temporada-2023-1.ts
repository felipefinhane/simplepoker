/**
 * Importa a Temporada 2023.1, de uma planilha Google Sheets (link
 * passado pelo Organizador -- ver ticket 28). Mesmo padrao dos imports
 * anteriores (tickets 24/27): Temporada ja encerrada, sem mexer na
 * Temporada aberta. Premiacao real era percentual do pote (50%/30%,
 * mesma estrutura das Temporadas 2024.2/2025.2 do ticket 27) -- cada
 * `entradaNoCaixa` ja vem pronta da planilha, validada contra a coluna
 * "$" original (bate em todas as 19 Partidas).
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/import-temporada-2023-1.ts [--dry-run]
 */
import { importarTemporadaHistorica, type PartidaImportada } from "./lib/importar-temporada-historica";

const DRY_RUN = process.argv.includes("--dry-run");

const PARTIDAS: PartidaImportada[] = [
  { data: "2023-02-07", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 9, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 2, pagamento: true }, { nome: "Turati", posicao: 5, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 3, pagamento: true }] },
  { data: "2023-02-14", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 4, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 3, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 3, pagamento: true }, { nome: "Nino", posicao: 3, almas: 0, pagamento: true }, { nome: "Galego", posicao: 9, almas: 0, pagamento: true }, { nome: "Turati", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2023-02-28", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 2, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 6, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 8, almas: 0, pagamento: true }, { nome: "Nino", posicao: 9, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 3, pagamento: true }, { nome: "Turati", posicao: 5, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 10, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2023-03-07", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 2, almas: 2, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Turati", posicao: 3, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 1, almas: 4, pagamento: true }, { nome: "Ueda", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2023-03-14", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 1, pagamento: true }, { nome: "Nino", posicao: 9, almas: 0, pagamento: true }, { nome: "Galego", posicao: 3, almas: 1, pagamento: true }, { nome: "Turati", posicao: 1, almas: 3, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 2, pagamento: true }] },
  { data: "2023-03-21", entradaNoCaixa: 22, participantes: [{ nome: "Mica", posicao: 2, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 6, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 3, pagamento: true }, { nome: "Turati", posicao: 11, almas: 0, pagamento: true }, { nome: "Enio", posicao: 10, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 4, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2023-03-28", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 2, almas: 3, pagamento: true }, { nome: "Felipe", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Turati", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 1, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 3, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2023-04-04", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 10, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 3, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 4, pagamento: true }, { nome: "Turati", posicao: 9, almas: 0, pagamento: true }, { nome: "Enio", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 2, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2023-04-11", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 9, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 3, pagamento: true }, { nome: "Galego", posicao: 3, almas: 0, pagamento: true }, { nome: "Turati", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 1, almas: 3, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 1, pagamento: true }] },
  { data: "2023-04-18", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 2, almas: 5, pagamento: true }, { nome: "Felipe", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 9, almas: 0, pagamento: true }, { nome: "Turati", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 10, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 6, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 1, almas: 2, pagamento: true }] },
  { data: "2023-04-25", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 4, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 5, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 1, pagamento: true }, { nome: "Nino", posicao: 2, almas: 2, pagamento: true }, { nome: "Galego", posicao: 3, almas: 2, pagamento: true }, { nome: "Turati", posicao: 8, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 6, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2023-05-02", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 6, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Nino", posicao: 7, almas: 1, pagamento: true }, { nome: "Galego", posicao: 5, almas: 2, pagamento: true }, { nome: "Turati", posicao: 3, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 1, almas: 2, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2023-05-09", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 10, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 9, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 1, pagamento: true }, { nome: "Nino", posicao: 4, almas: 1, pagamento: true }, { nome: "Galego", posicao: 1, almas: 2, pagamento: true }, { nome: "Turati", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 5, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 3, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2023-05-16", entradaNoCaixa: 22, participantes: [{ nome: "Mica", posicao: 4, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 6, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 9, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 4, pagamento: true }, { nome: "Turati", posicao: 7, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 11, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 0, pagamento: true }] },
  { data: "2023-05-23", entradaNoCaixa: 12, participantes: [{ nome: "Mica", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 2, pagamento: true }, { nome: "Galego", posicao: 4, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2023-05-30", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 2, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 3, almas: 1, pagamento: true }, { nome: "Galego", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 1, almas: 2, pagamento: true }] },
  { data: "2023-06-06", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 2, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 8, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 3, almas: 1, pagamento: true }, { nome: "Galego", posicao: 1, almas: 3, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2023-06-13", entradaNoCaixa: 22, participantes: [{ nome: "Mica", posicao: 2, almas: 4, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 10, almas: 0, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 5, almas: 0, pagamento: true }, { nome: "Turati", posicao: 4, almas: 0, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 11, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 1, almas: 2, pagamento: true }] },
  { data: "2023-06-20", entradaNoCaixa: 22, participantes: [{ nome: "Mica", posicao: 5, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 11, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 9, almas: 0, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 3, almas: 0, pagamento: true }, { nome: "Turati", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 2, almas: 3, pagamento: true }, { nome: "Sergio", posicao: 10, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 4, almas: 2, pagamento: true }, { nome: "Ueda", posicao: 1, almas: 3, pagamento: true }] },
];

importarTemporadaHistorica({
  rotulo: "2023.1",
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
    { data: "2023-03-28", descricao: "Compra de novo baralho", valor: 40 },
    { data: "2023-06-15", descricao: "Compra da premiação de fim de temporada", valor: 250 }
  ],
  totaisEsperados: {
    Enio: { pontos: 82, almas: 7 },
    Nino: { pontos: 162, almas: 17 },
    Mica: { pontos: 211, almas: 27 },
    Felipe: { pontos: 82, almas: 7 },
    Turati: { pontos: 87, almas: 4 },
    Galego: { pontos: 232, almas: 23 },
    Sergio: { pontos: 129, almas: 10 },
    Carlos: { pontos: 116, almas: 16 },
    Ueda: { pontos: 206, almas: 15 },
    Danilo: { pontos: 121, almas: 9 },
    Edinho: { pontos: 92, almas: 5 }
  },
  dryRun: DRY_RUN,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
