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
    // Os arquivos compartilham um Postgres real, e tabelas como
    // `temporadas` têm uma regra global ("só uma aberta") que não é
    // isolada por teste — rodar arquivos em paralelo cria corridas entre
    // eles, não só dentro de um mesmo arquivo.
    fileParallelism: false,
  },
});
