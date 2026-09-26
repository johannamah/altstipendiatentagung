import { defineConfig, globalIgnores } from "eslint/config";
import eslintAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Erzeugte und fremde Verzeichnisse. Der Einzeldatei-Entwurf index.html wird
  // laut ADR-0003 abgeloest und nicht mehr nachgebessert.
  globalIgnores([
    "dist/**",
    ".astro/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "lighthouse-bericht/**",
    "archiv/**",
  ]),
  tseslint.configs.recommended,
  eslintAstro.configs["flat/recommended"],
  {
    rules: {
      // Ungenutzte Variablen sind ein Fehler, nicht eine Warnung - sonst sammeln
      // sie sich an. Bewusst ungenutzte Argumente werden mit _ gekennzeichnet.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
]);
