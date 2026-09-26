import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-End-Tests laufen gegen den GEBAUTEN Stand, nicht gegen den
 * Entwicklungsserver: Nur so wird geprueft, was Nutzende spaeter bekommen.
 *
 * Geprueft wird bei schmalem und breitem Viewport (AGENTS.md, Abschnitt
 * "UI/UX und UI-Tests").
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Ein vergessenes test.only wuerde in der CI still den Grossteil der Suite
  // ueberspringen - hier bricht der Lauf stattdessen ab.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: "http://localhost:4321",
    // Spuren nur beim ersten Fehlversuch: sie kosten Zeit und Speicher.
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "smartphone",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ASTRO_TELEMETRY_DISABLED: "1" },
  },
});
