// @ts-check
import { defineConfig } from "astro/config";

// Die Produktionsdomain ist noch offen (siehe docs/offene-fragen.md, F11).
// Sobald sie feststeht, wird hier `site` gesetzt - erst dann erzeugt Astro
// absolute URLs fuer Sitemap und Metadaten korrekt.
export default defineConfig({
  build: { format: "directory" },
  // Der Einzeldatei-Entwurf `index.html` im Wurzelverzeichnis bleibt laut
  // ADR-0003 als lauffaehige Vorschau bestehen und wird bewusst NICHT
  // mitgebaut - er liegt ausserhalb von src/ und public/.
});
