import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Testes de integração (precisam de Postgres) rodam à parte, via
    // `npm run test:integration` — ver vitest.integration.config.mts.
    exclude: ["**/node_modules/**", "test/integration/**"],
  },
});
