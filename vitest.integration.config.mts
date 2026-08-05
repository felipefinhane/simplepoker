import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes que precisam de um Postgres real (DATABASE_URL) — rodam à parte
// do `npm test`, via `npm run test:integration`, pra manter o comando
// padrão rápido e sem dependência externa. Ver test/integration/README.md.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
  },
});
