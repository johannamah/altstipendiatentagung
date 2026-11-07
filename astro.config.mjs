// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Produktionsdomain (ADR-0012). Astro erzeugt damit absolute URLs.
  site: "https://altstipendiaten-jahrestagung.de",
  build: { format: "directory" },
  // Der Einzeldatei-Entwurf `index.html` im Wurzelverzeichnis bleibt laut
  // ADR-0003 als lauffaehige Vorschau bestehen und wird bewusst NICHT
  // mitgebaut - er liegt ausserhalb von src/ und public/.
});
