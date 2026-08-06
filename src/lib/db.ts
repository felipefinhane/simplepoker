import { Pool, type PoolClient } from "pg";

declare global {
  var pgPool: Pool | undefined;
}

/**
 * Pool de conexão único, reaproveitado entre requisições (e entre reloads
 * do Next.js em dev) para não esgotar as conexões do Postgres.
 */
export const db =
  global.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Bancos gerenciados (ex: Neon) exigem SSL; o Postgres local do
    // docker-compose não fala SSL. `rejectUnauthorized: false` evita falha
    // por cadeia de certificado não reconhecida no runtime serverless.
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = db;
}

/**
 * Roda `fn` dentro de uma transação (BEGIN/COMMIT, ROLLBACK em caso de
 * erro) — necessário quando uma operação grava em mais de uma tabela e
 * precisa ser tudo-ou-nada (ex: lançar resultado de uma Partida).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
