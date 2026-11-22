import { availableParallelism, totalmem } from "node:os";

import { defineConfig } from "vitest/config";

/**
 * Parallele Testprozesse nach Arbeitsspeicher begrenzen: etwa einer je 0,8 GB.
 *
 * Im Dev-Container stehen knapp 2 GB zur Verfuegung. Mit der Voreinstellung
 * (ein Prozess je Kern, dort fuenf) brach `npm run pruefen` gelegentlich mit
 * ENOMEM ab - meist direkt nach `astro check`, das selbst viel Speicher belegt.
 * In der CI ist genug Speicher; dort bleibt es bei einem Prozess je Kern.
 */
const nachSpeicher = Math.max(1, Math.floor(totalmem() / 800_000_000));
const nachKernen = Math.max(1, availableParallelism() - 1);

export default defineConfig({
  test: {
    // Playwright-Tests laufen ueber `npm run test:e2e`, nicht ueber Vitest.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    maxWorkers: Math.min(nachKernen, nachSpeicher),
  },
});
