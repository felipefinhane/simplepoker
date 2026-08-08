/**
 * Unifica dois Jogadores que são a mesma pessoa na vida real, mas
 * viraram dois cadastros diferentes (grafias diferentes entre planilhas
 * de épocas diferentes — ex: "Carlos" x "Carlão", ver ticket 30).
 * Repassa todos os Lançamentos (como participante e como eliminador) do
 * duplicado pro canônico, e apaga o cadastro duplicado.
 *
 * Recusa a unificar se achar alguma Partida onde os dois já aparecem
 * juntos (isso significaria que são pessoas diferentes de verdade, ou
 * que uma delas está errada — não é o caso esperado aqui).
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/unificar-jogadores.ts \
 *     --canonico "Carlão" --duplicado "Carlos" [--dry-run]
 */
import { Pool } from "pg";

function pegarArg(nome: string): string | null {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice === -1 ? null : (process.argv[indice + 1] ?? null);
}

const DRY_RUN = process.argv.includes("--dry-run");
const NOME_CANONICO = pegarArg("canonico");
const NOME_DUPLICADO = pegarArg("duplicado");

async function main() {
  if (!process.env.DATABASE_URL || !NOME_CANONICO || !NOME_DUPLICADO) {
    console.error(
      'Uso: DATABASE_URL="..." npx tsx scripts/unificar-jogadores.ts --canonico "Nome" --duplicado "Nome" [--dry-run]',
    );
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

    async function acharUm(nome: string): Promise<{ id: number; nome: string }> {
      const { rows } = await client.query<{ id: number; nome: string }>(
        `SELECT id, nome FROM jogadores WHERE nome ILIKE $1`,
        [nome],
      );
      if (rows.length === 0) throw new Error(`Nenhum Jogador chamado "${nome}" encontrado.`);
      if (rows.length > 1) {
        throw new Error(
          `Mais de um Jogador chamado "${nome}" (ids: ${rows.map((r) => r.id).join(", ")}) — resolva a ambiguidade manualmente.`,
        );
      }
      return rows[0];
    }

    const canonico = await acharUm(NOME_CANONICO);
    const duplicado = await acharUm(NOME_DUPLICADO);
    console.log(
      `Canônico: "${canonico.nome}" (id ${canonico.id})  |  Duplicado: "${duplicado.nome}" (id ${duplicado.id})`,
    );

    const { rows: conflitos } = await client.query<{ partida_id: number }>(
      `SELECT l1.partida_id
       FROM lancamentos l1
       JOIN lancamentos l2 ON l1.partida_id = l2.partida_id
       WHERE l1.jogador_id = $1 AND l2.jogador_id = $2`,
      [canonico.id, duplicado.id],
    );
    if (conflitos.length > 0) {
      throw new Error(
        `Os dois Jogadores aparecem juntos na(s) Partida(s) ${conflitos.map((c) => c.partida_id).join(", ")} — não são a mesma pessoa (ou uma das duas está errada). Abortando sem mudar nada.`,
      );
    }

    const comoParticipante = await client.query(
      `UPDATE lancamentos SET jogador_id = $1 WHERE jogador_id = $2`,
      [canonico.id, duplicado.id],
    );
    const comoEliminador = await client.query(
      `UPDATE lancamentos SET eliminado_por_jogador_id = $1 WHERE eliminado_por_jogador_id = $2`,
      [canonico.id, duplicado.id],
    );
    console.log(
      `Repassados: ${comoParticipante.rowCount} Lançamento(s) como participante, ${comoEliminador.rowCount} como eliminador.`,
    );

    await client.query(`DELETE FROM jogadores WHERE id = $1`, [duplicado.id]);
    console.log(`Jogador duplicado "${duplicado.nome}" (id ${duplicado.id}) removido.`);

    if (DRY_RUN) {
      await client.query("ROLLBACK");
      console.log("\n--dry-run: nada foi gravado (ROLLBACK).");
    } else {
      await client.query("COMMIT");
      console.log("\nUnificação concluída com sucesso.");
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
  console.error(error.message ?? error);
  process.exitCode = 1;
});
