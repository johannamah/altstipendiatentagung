import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import astroKonfiguration from "../../astro.config.mjs";

/**
 * Auslieferung ueber Cloudflare (ADR-0012). Geprueft wird, was beim Hoster
 * schiefgehen kann, ohne dass ein lokaler Lauf es merkt: Astro und
 * `astro preview` kennen weder wrangler.jsonc noch _headers.
 */

const wurzel = (pfad: string) => fileURLToPath(new URL(`../../${pfad}`, import.meta.url));

/**
 * wrangler.jsonc erlaubt Kommentare und abschliessende Kommas (Prettier setzt
 * sie). Kommentare stehen hier nur auf eigenen Zeilen.
 */
function wranglerKonfiguration() {
  const roh = readFileSync(wurzel("wrangler.jsonc"), "utf8");
  return JSON.parse(roh.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));
}

/** Kopfzeilen je Pfadmuster aus public/_headers. */
function kopfzeilen(): Map<string, string[]> {
  const regeln = new Map<string, string[]>();
  let muster: string | undefined;
  for (const zeile of readFileSync(wurzel("public/_headers"), "utf8").split("\n")) {
    if (zeile.trim() === "" || zeile.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(zeile)) {
      muster = zeile.trim();
      regeln.set(muster, []);
    } else if (muster) {
      regeln.get(muster)!.push(zeile.trim());
    }
  }
  return regeln;
}

describe("Adresse", () => {
  it("ist die Domain der Tagung", () => {
    expect(astroKonfiguration.site).toBe("https://altstipendiaten-jahrestagung.de");
  });
});

describe("Cloudflare-Konfiguration", () => {
  const konfiguration = wranglerKonfiguration();

  it("liefert den Astro-Build aus", () => {
    expect(konfiguration.assets.directory).toBe("./dist");
  });

  it("zeigt bei unbekannten Adressen die Fehlerseite statt der Startseite", () => {
    expect(konfiguration.assets.not_found_handling).toBe("404-page");
  });

  /** Eine zweite Adresse laege an Cloudflare Access vorbei. */
  it("hat keine zusaetzlichen workers.dev- oder Vorschau-Adressen", () => {
    expect(konfiguration.workers_dev).toBe(false);
    expect(konfiguration.preview_urls).toBe(false);
  });

  it("haengt an der Domain der Tagung", () => {
    expect(konfiguration.routes).toEqual([
      { pattern: "altstipendiaten-jahrestagung.de", custom_domain: true },
    ]);
  });

  it("schickt keine Nutzungsdaten an Cloudflare", () => {
    expect(konfiguration.send_metrics).toBe(false);
  });
});

describe("Kopfzeilen", () => {
  const regeln = kopfzeilen();

  /** Sonst haengen Geraete tagelang an einem alten Service Worker. */
  it("laesst den Service Worker nicht zwischenspeichern", () => {
    expect(regeln.get("/sw.js")).toContain("Cache-Control: no-cache");
  });

  it("speichert gehashte Dateien dauerhaft", () => {
    expect(regeln.get("/_astro/*")).toContain("Cache-Control: public, max-age=31536000, immutable");
  });

  it("setzt Sicherheitskopfzeilen fuer jede Seite", () => {
    expect(regeln.get("/*")).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "X-Frame-Options: DENY",
      ]),
    );
  });
});
