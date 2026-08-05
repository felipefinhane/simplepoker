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
