import { Pool } from "pg";

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
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = db;
}
