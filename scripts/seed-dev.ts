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
import {
  buscarTemporadaAberta,
  criarTemporada,
  obterParametrosPadraoParaNovaTemporada,
  serializarParametros,
} from "../src/lib/temporadas";
import { hashSenha, senhaInicialParaTelefone } from "../src/lib/auth/senha";
import { normalizarTelefone } from "../src/lib/auth/telefone";

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
    const parametros = await obterParametrosPadraoParaNovaTemporada();
    await criarTemporada(serializarParametros(parametros));
    console.log("[seed:dev] Temporada aberta criada com os Parâmetros padrão.");
  }

  console.log("[seed:dev] Pronto — já dá pra testar Nova Partida.");
}

main()
  .catch((error) => {
    console.error("[seed:dev] Falha ao popular o banco:", error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
