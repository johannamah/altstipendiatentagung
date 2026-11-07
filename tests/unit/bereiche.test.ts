import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BEREICHE, SEITENBEREICHE, kachelZiel } from "../../src/daten/bereiche.ts";

const lies = (pfad: string) => readFileSync(fileURLToPath(new URL(pfad, import.meta.url)), "utf8");

const tokens = lies("../../src/styles/tokens.css");
const sammlung = lies("../../src/components/IkonenSammlung.astro");

describe("Bereiche der Startseite", () => {
  it("sind vorhanden", () => {
    expect(BEREICHE.length).toBeGreaterThan(0);
  });

  it("haben eindeutige Adressfragmente", () => {
    const slugs = BEREICHE.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("haben eindeutige Farben - zwei gleichfarbige Kacheln waeren nicht unterscheidbar", () => {
    const farben = BEREICHE.map((b) => b.farbe);
    expect(new Set(farben).size).toBe(farben.length);
  });

  /**
   * Fehlt ein Farbtoken, faellt die Kachel im Browser auf eine transparente
   * Flaeche zurueck - und der Text darauf ist unlesbar. Das faellt beim
   * Durchklicken leicht durch, deshalb prueft es der Test.
   */
  it.each(BEREICHE.map((b) => b.farbe))("Farbe %s ist in tokens.css definiert", (farbe) => {
    for (const teil of ["von", "bis", "text"]) {
      expect(tokens, `--kachel-${farbe}-${teil} fehlt in tokens.css`).toContain(
        `--kachel-${farbe}-${teil}:`,
      );
    }
  });

  it.each(BEREICHE.map((b) => b.ikone))("Icon %s ist in der Icon-Sammlung enthalten", (ikone) => {
    expect(sammlung, `<symbol id="i-${ikone}"> fehlt`).toContain(`id="i-${ikone}"`);
  });

  it("haben jeweils Titel und erklaerende Unterzeile", () => {
    for (const bereich of BEREICHE) {
      expect(bereich.titel.trim().length, `Titel fehlt bei ${bereich.slug}`).toBeGreaterThan(0);
      // Regel 23/24: Eine Kachel ohne Erklaerung laesst offen, was dahinter liegt.
      expect(
        bereich.unterzeile.trim().length,
        `Unterzeile fehlt bei ${bereich.slug}`,
      ).toBeGreaterThan(0);
    }
  });
});

/**
 * Die Anmeldung laeuft ueber Microsoft Forms des Vereins (ADR-0011). Die
 * Kachel fuehrt deshalb direkt dorthin, ohne Zwischenseite in der App.
 */
describe("Kacheln mit externem Ziel", () => {
  const anmeldung = BEREICHE.find((b) => b.slug === "anmeldung")!;

  it("Anmeldung fuehrt direkt auf das Anmeldeformular", () => {
    expect(kachelZiel(anmeldung)).toBe("https://forms.cloud.microsoft/e/yyrAWFASLc");
  });

  it("interne Kacheln fuehren auf ihre eigene Seite", () => {
    const programm = BEREICHE.find((b) => b.slug === "programm")!;
    expect(kachelZiel(programm)).toBe("/programm");
  });

  it("externe Ziele sind verschluesselte Adressen", () => {
    for (const bereich of BEREICHE.filter((b) => b.extern !== undefined)) {
      expect(bereich.extern, bereich.slug).toMatch(/^https:\/\//);
    }
  });

  it("nur Kacheln ohne externes Ziel haben eine eigene Seite", () => {
    expect(SEITENBEREICHE.map((b) => b.slug)).not.toContain("anmeldung");
    expect(SEITENBEREICHE.map((b) => b.slug)).toContain("programm");
  });

  /**
   * Wer die Kachel antippt, verlaesst die App. Das muss vorher erkennbar
   * sein - sichtbar in der Unterzeile, nicht nur fuer Screenreader.
   */
  it("kuendigen den neuen Tab in der Unterzeile an", () => {
    for (const bereich of BEREICHE.filter((b) => b.extern !== undefined)) {
      expect(bereich.unterzeile, bereich.slug).toMatch(/neue[mn]? Tab/);
    }
  });
});
