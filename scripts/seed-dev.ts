/**
 * Popula o banco local (Docker) com dados parecidos com produção — o
 * Organizador, o elenco real de Jogadores e uma Temporada aberta com os
 * Parâmetros padrão — pra já cair testando (ex: criar uma Partida) sem
 * ter que cadastrar tudo na mão toda vez que sobe o ambiente.
 *
 * Rodado automaticamente pelo `docker-compose.yml` a cada `docker
 * compose up` (depois das migrations). Idempotente: só faz alguma coisa
 * se o banco ainda não tiver nenhum Jogador — não pisa em cima de dados
 * que você já criou brincando com o app.
 *
 * Uso manual (fora do Docker): DATABASE_URL="..." npm run seed:dev
 * Nome/telefone do Organizador são opcionais — usa um padrão de dev se
 * não informados (`ORGANIZADOR_NOME`/`ORGANIZADOR_TELEFONE`, mesmas
 * variáveis do `seed:organizador`).
 */
import { db } from "../src/lib/db";
import { criarJogador, listarJogadores } from "../src/lib/jogadores";
import { buscarTemporadaAberta, criarTemporada } from "../src/lib/temporadas";
import { hashSenha, senhaInicialParaTelefone } from "../src/lib/auth/senha";
import { normalizarTelefone } from "../src/lib/auth/telefone";

// Os mesmos Parâmetros da Temporada aberta em produção (conferido
// direto no banco, ticket 32) — Tabela de Pontos e multiplicadores já
// batiam com o padrão (`obterParametrosPadraoParaNovaTemporada`), mas
// Estrutura de Blinds e Fichas Iniciais ficavam vazias nesse fallback;
// aqui usa os valores reais pra testar Timer/Fichas igual produção.
const PARAMETROS_IGUAIS_A_PRODUCAO = {
  tabelaDePontos: [
    [1, 25], [2, 18], [3, 15], [4, 12], [5, 10], [6, 8], [7, 6],
    [8, 4], [9, 2], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1],
  ] as [number, number][],
  valorDaPartida: 10,
  multiplicadorPremiacaoPrimeiro: 2,
  multiplicadorPremiacaoSegundo: 1,
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
  fichasIniciais: [
    { valor: 100, quantidade: 10 },
    { valor: 50, quantidade: 10 },
    { valor: 1000, quantidade: 3 },
    { valor: 5000, quantidade: 1 },
    { valor: 500, quantidade: 1 },
  ],
};

const ORGANIZADOR_NOME = process.env.ORGANIZADOR_NOME ?? "Organizador Teste";
const ORGANIZADOR_TELEFONE = process.env.ORGANIZADOR_TELEFONE ?? "11999998888";

// O elenco real do grupo (mesmos nomes das Temporadas importadas nos
// tickets 24/27/28) — só pra ter gente de verdade pra selecionar ao
// testar "Nova Partida" localmente, não é dado de produção nenhum.
const ELENCO = [
  "Sergio",
  "Danilo",
  "Nino",
  "Carlão",
  "Edinho",
  "Felipe",
  "Enio",
  "Ueda",
  "Grande",
  "Turati",
  "Alexandre",
  "Mica",
  "Chico",
  "Galego",
];

async function main() {
  const jaTemJogadores = await listarJogadores();
  if (jaTemJogadores.length > 0) {
    console.log(
      `[seed:dev] Banco já tem ${jaTemJogadores.length} Jogador(es) cadastrado(s) — nada a fazer (só roda em banco vazio).`,
    );
    return;
  }

  const telefone = normalizarTelefone(ORGANIZADOR_TELEFONE);
  const senhaHash = await hashSenha(senhaInicialParaTelefone(telefone));
  await db.query(
    `INSERT INTO jogadores (nome, telefone, senha_hash, eh_organizador)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (telefone) DO NOTHING`,
    [ORGANIZADOR_NOME, telefone, senhaHash],
  );
  console.log(
    `[seed:dev] Organizador "${ORGANIZADOR_NOME}" pronto — login ${ORGANIZADOR_TELEFONE} / senha ${telefone.slice(-4)}.`,
  );

  for (const nome of ELENCO) {
    await criarJogador(nome);
  }
  console.log(`[seed:dev] ${ELENCO.length} Jogadores cadastrados: ${ELENCO.join(", ")}.`);

  const jaAberta = await buscarTemporadaAberta();
  if (!jaAberta) {
    await criarTemporada(PARAMETROS_IGUAIS_A_PRODUCAO);
    console.log("[seed:dev] Temporada aberta criada com os mesmos Parâmetros de produção.");
  }

  console.log("[seed:dev] Pronto — já dá pra testar Nova Partida.");
}

main()
  .catch((error) => {
    console.error("[seed:dev] Falha ao popular o banco:", error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
