/**
 * Importa a Temporada 2024.1, de uma planilha Google Sheets (link
 * passado pelo Organizador -- ver ticket 28). Mesmo padrao dos imports
 * anteriores (tickets 24/27): Temporada ja encerrada, sem mexer na
 * Temporada aberta. Premiacao real era percentual do pote (50%/30%,
 * mesma estrutura das Temporadas 2024.2/2025.2 do ticket 27) -- cada
 * `entradaNoCaixa` ja vem pronta da planilha, validada contra a coluna
 * "$" original (bate em todas as 22 Partidas).
 *
 * ATENCAO -- unica divergencia nao resolvida entre os 6 imports feitos
 * ate agora: o Saldo do Caixa final calculado aqui (soma das entradas
 * menos a saida do baralho, R$317) fica R$20 acima do "TOTAL EM CAIXA"
 * que a propria planilha registrava (R$297). Toda Partida bate 100% com
 * a formula 50%/30% do pote, os Pontos/Almas de cada Jogador tambem
 * batem, e so achei duas notas manuais na planilha (a sobra de R$34 do
 * campeonato anterior, e a compra do baralho por R$45) -- nenhuma
 * combinacao delas fecha os R$20 de diferenca, e nao achei mais nenhuma
 * nota explicando isso. Optei por nao adivinhar um ajuste sem uma fonte
 * clara (diferente do que fiz na Temporada 2022, onde as notas bateram
 * exato) -- o Saldo do Caixa desta Temporada especificamente pode estar
 * R$20 mais alto do que o real.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/import-temporada-2024-1.ts [--dry-run]
 */
import { importarTemporadaHistorica, type PartidaImportada } from "./lib/importar-temporada-historica";

const DRY_RUN = process.argv.includes("--dry-run");

const PARTIDAS: PartidaImportada[] = [
  { data: "2024-01-09", entradaNoCaixa: 14, participantes: [{ nome: "Felipe", posicao: 4, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 6, almas: 1, pagamento: true }, { nome: "Galego", posicao: 1, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 3, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 2, pagamento: true }] },
  { data: "2024-01-16", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 3, almas: 2, pagamento: true }, { nome: "Galego", posicao: 1, almas: 2, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-01-23", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 4, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 1, almas: 5, pagamento: true }, { nome: "Danilo", posicao: 8, almas: 0, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2024-01-30", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 8, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 1, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 3, almas: 0, pagamento: true }, { nome: "Enio", posicao: 1, almas: 2, pagamento: true }, { nome: "Sergio", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 1, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2024-02-06", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 5, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 3, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 3, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 9, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 4, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-02-20", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 9, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 1, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 2, almas: 2, pagamento: true }, { nome: "Enio", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 4, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 1, almas: 3, pagamento: true }, { nome: "Ueda", posicao: 2, almas: 1, pagamento: true }] },
  { data: "2024-02-27", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 10, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 1, pagamento: true }, { nome: "Galego", posicao: 1, almas: 6, pagamento: true }, { nome: "Enio", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 3, almas: 1, pagamento: true }] },
  { data: "2024-03-05", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 3, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 1, almas: 1, pagamento: true }, { nome: "Nino", posicao: 5, almas: 0, pagamento: true }, { nome: "Galego", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 4, almas: 2, pagamento: true }] },
  { data: "2024-03-12", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 1, pagamento: true }, { nome: "Galego", posicao: 2, almas: 0, pagamento: true }, { nome: "Enio", posicao: 6, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 5, almas: 3, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-03-19", entradaNoCaixa: 14, participantes: [{ nome: "Felipe", posicao: 4, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 2, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 2, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 1, almas: 3, pagamento: true }, { nome: "Carlos", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2024-03-26", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 5, almas: 0, pagamento: true }, { nome: "Galego", posicao: 3, almas: 2, pagamento: true }, { nome: "Enio", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 1, almas: 3, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }] },
  { data: "2024-04-02", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 5, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 6, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 2, almas: 3, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 3, pagamento: true }, { nome: "Enio", posicao: 7, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2024-04-09", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 6, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 3, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 3, pagamento: true }, { nome: "Edinho", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Enio", posicao: 4, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 2, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 1, pagamento: true }] },
  { data: "2024-04-16", entradaNoCaixa: 10, participantes: [{ nome: "Felipe", posicao: 6, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 3, pagamento: true }, { nome: "Galego", posicao: 4, almas: 1, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 0, pagamento: true }] },
  { data: "2024-04-23", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 7, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 3, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 3, pagamento: true }, { nome: "Galego", posicao: 4, almas: 2, pagamento: true }, { nome: "Carlos", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2024-04-30", entradaNoCaixa: 14, participantes: [{ nome: "Mica", posicao: 3, almas: 1, pagamento: true }, { nome: "Felipe", posicao: 4, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 6, almas: 0, pagamento: true }, { nome: "Nino", posicao: 2, almas: 2, pagamento: true }, { nome: "Galego", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 0, pagamento: true }] },
  { data: "2024-05-07", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 3, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 0, pagamento: true }, { nome: "Nino", posicao: 4, almas: 1, pagamento: true }, { nome: "Galego", posicao: 5, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 6, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 7, almas: 0, pagamento: true }] },
  { data: "2024-05-21", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 4, almas: 2, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 1, pagamento: true }, { nome: "Danilo", posicao: 1, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 0, pagamento: true }, { nome: "Nino", posicao: 6, almas: 0, pagamento: true }, { nome: "Galego", posicao: 8, almas: 0, pagamento: true }, { nome: "Turati", posicao: 3, almas: 2, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 9, almas: 0, pagamento: true }] },
  { data: "2024-05-28", entradaNoCaixa: 16, participantes: [{ nome: "Mica", posicao: 5, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 2, almas: 2, pagamento: true }, { nome: "Danilo", posicao: 4, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 3, almas: 3, pagamento: true }, { nome: "Nino", posicao: 7, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 1, pagamento: true }, { nome: "Turati", posicao: 8, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 6, almas: 0, pagamento: true }] },
  { data: "2024-06-04", entradaNoCaixa: 20, participantes: [{ nome: "Mica", posicao: 10, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 9, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 7, almas: 0, pagamento: true }, { nome: "Edinho", posicao: 5, almas: 1, pagamento: true }, { nome: "Nino", posicao: 1, almas: 2, pagamento: true }, { nome: "Galego", posicao: 4, almas: 1, pagamento: true }, { nome: "Turati", posicao: 2, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 3, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 8, almas: 0, pagamento: true }, { nome: "Ueda", posicao: 6, almas: 2, pagamento: true }] },
  { data: "2024-06-11", entradaNoCaixa: 16, participantes: [{ nome: "Felipe", posicao: 6, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 2, almas: 2, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 1, pagamento: true }, { nome: "Nino", posicao: 8, almas: 0, pagamento: true }, { nome: "Galego", posicao: 1, almas: 2, pagamento: true }, { nome: "Turati", posicao: 3, almas: 0, pagamento: true }, { nome: "Sergio", posicao: 7, almas: 0, pagamento: true }, { nome: "Carlos", posicao: 5, almas: 1, pagamento: true }] },
  { data: "2024-06-18", entradaNoCaixa: 18, participantes: [{ nome: "Mica", posicao: 9, almas: 0, pagamento: true }, { nome: "Felipe", posicao: 7, almas: 0, pagamento: true }, { nome: "Danilo", posicao: 8, almas: 1, pagamento: true }, { nome: "Edinho", posicao: 4, almas: 0, pagamento: true }, { nome: "Nino", posicao: 1, almas: 3, pagamento: true }, { nome: "Galego", posicao: 3, almas: 2, pagamento: true }, { nome: "Turati", posicao: 5, almas: 0, pagamento: true }, { nome: "Enio", posicao: 2, almas: 1, pagamento: true }, { nome: "Carlos", posicao: 6, almas: 0, pagamento: true }] },
];

importarTemporadaHistorica({
  rotulo: "2024.1",
  partidas: PARTIDAS,
  parametros: {
    tabelaDePontos: [
      [1, 23], [2, 17], [3, 12], [4, 8], [5, 5], [6, 3], [7, 2],
      [8, 1], [9, 1], [10, 1], [11, 1], [12, 1],
    ],
    valorDaPartida: 10,
    multiplicadorPremiacaoPrimeiro: 0,
    multiplicadorPremiacaoSegundo: 0,
    estruturaDeBlinds: [],
    fichasIniciais: [],
  },
  saidasManuais: [
    { data: "2024-04-23", descricao: "Compra de novo baralho", valor: 45 }
  ],
  totaisEsperados: {
    Enio: { pontos: 80, almas: 3 },
    Nino: { pontos: 233, almas: 22 },
    Mica: { pontos: 77, almas: 6 },
    Felipe: { pontos: 240, almas: 19 },
    Turati: { pontos: 49, almas: 2 },
    Galego: { pontos: 288, almas: 26 },
    Sergio: { pontos: 165, almas: 12 },
    Carlos: { pontos: 108, almas: 10 },
    Ueda: { pontos: 72, almas: 6 },
    Danilo: { pontos: 239, almas: 18 },
    Edinho: { pontos: 143, almas: 12 }
  },
  dryRun: DRY_RUN,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
