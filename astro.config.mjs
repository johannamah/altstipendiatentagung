// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Produktionsdomain (ADR-0012). Astro erzeugt damit absolute URLs.
  site: "https://altstipendiaten-jahrestagung.de",
  build: { format: "directory" },
});
