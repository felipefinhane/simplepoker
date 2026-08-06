import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // A regra é da era do Pages Router (só reconhece `pages/_document.js`
      // como "global") — no App Router, o layout raiz (`src/app/layout.tsx`)
      // é o lugar correto pra um <link> de fonte que vale pro app inteiro,
      // e a própria doc do Next recomenda desligar a regra nesse caso.
      "@next/next/no-page-custom-font": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
