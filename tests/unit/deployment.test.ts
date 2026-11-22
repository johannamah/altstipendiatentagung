import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import astroKonfiguration from "../../astro.config.mjs";

/**
 * Auslieferung ueber Vercel (ADR-0013). Geprueft wird, was beim Hoster
 * schiefgehen kann, ohne dass ein lokaler Lauf es merkt: `astro preview`
 * kennt vercel.json nicht.
 */

const wurzel = (pfad: string) => fileURLToPath(new URL(`../../${pfad}`, import.meta.url));

interface Kopfzeilenregel {
  source: string;
  headers: { key: string; value: string }[];
}

const konfiguration = JSON.parse(readFileSync(wurzel("vercel.json"), "utf8")) as {
  framework: string;
  outputDirectory: string;
  trailingSlash: boolean;
  git: { deploymentEnabled: Record<string, boolean> };
  headers: Kopfzeilenregel[];
};

/** Kopfzeilen einer Regel als "Name: Wert", wie man sie im Browser liest. */
function kopfzeilen(quelle: string): string[] {
  const regel = konfiguration.headers.find((r) => r.source === quelle);
  return (regel?.headers ?? []).map((h) => `${h.key}: ${h.value}`);
}

describe("Adresse", () => {
  it("ist die Domain der Tagung", () => {
    expect(astroKonfiguration.site).toBe("https://altstipendiaten-jahrestagung.de");
  });
});

describe("Vercel-Konfiguration", () => {
  it("liefert den Astro-Build aus", () => {
    expect(konfiguration.framework).toBe("astro");
    expect(konfiguration.outputDirectory).toBe("dist");
  });

  /** Dieselben Adressen, die der Service Worker vorab speichert ("/programm/"). */
  it("fuehrt Adressen mit abschliessendem Schraegstrich", () => {
    expect(konfiguration.trailingSlash).toBe(true);
  });

  /**
   * Produktion nur ueber den Workflow mit Freigabe (AGENTS.md). Ein Push auf
   * main darf nicht nebenbei ueber die Git-Anbindung live gehen.
   */
  it("deployt main nicht ueber die Git-Anbindung", () => {
    expect(konfiguration.git.deploymentEnabled.main).toBe(false);
  });

  it("enthaelt keine Cloudflare-Konfiguration mehr", () => {
    expect(existsSync(wurzel("wrangler.jsonc"))).toBe(false);
    expect(existsSync(wurzel("public/_headers"))).toBe(false);
  });
});

describe("Kopfzeilen", () => {
  /** Sonst haengen Geraete tagelang an einem alten Service Worker. */
  it("laesst den Service Worker nicht zwischenspeichern", () => {
    expect(kopfzeilen("/sw.js")).toContain("Cache-Control: no-cache");
  });

  it("speichert gehashte Dateien dauerhaft", () => {
    expect(kopfzeilen("/_astro/(.*)")).toContain(
      "Cache-Control: public, max-age=31536000, immutable",
    );
  });

  it("setzt Sicherheitskopfzeilen fuer jede Seite", () => {
    expect(kopfzeilen("/(.*)")).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "X-Frame-Options: DENY",
      ]),
    );
  });
});
