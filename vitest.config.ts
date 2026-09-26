import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright-Tests laufen ueber `npm run test:e2e`, nicht ueber Vitest.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
