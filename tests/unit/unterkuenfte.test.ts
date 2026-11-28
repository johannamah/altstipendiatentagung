import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Prueft den Datenbestand der Unterbringung (Stand: Zimmerkontingente
 * Jahrestagung 2027, 06.-09. Mai 2027).
 */

const inhalte = fileURLToPath(new URL("../../src/content", import.meta.url));
const lade = (datei: string) => JSON.parse(readFileSync(`${inhalte}/${datei}`, "utf8"));

interface Unterkunft {
  id: string;
  name: string;
  kontingent: boolean;
  stichwort?: string;
  web?: string;
  ortId?: string;
  bild?: string;
  bildbeschreibung?: string;
}

const unterkuenfte = lade("unterkuenfte.json") as Unterkunft[];
const ortIds = new Set((lade("orte.json") as { id: string }[]).map((o) => o.id));

describe("Unterkünfte", () => {
  it("sind die fünf Hotels mit Abrufkontingent", () => {
    expect(unterkuenfte.map((u) => u.name)).toEqual([
      "B&B Hotel Hildesheim",
      "HeyLou Hotel Hildesheim",
      "Schlafladen Hildesheim",
      "Hotel Bürgermeisterkapelle Hildesheim",
      "Van der Valk Hotel Hildesheim",
    ]);
  });

  it.each(unterkuenfte.map((u) => [u.name, u] as const))(
    "%s nennt das Stichwort und einen Buchungslink",
    (_name, unterkunft) => {
      expect(unterkunft.kontingent).toBe(true);
      // Wortlaut laut Programmheft - so wird er bei der Buchung angegeben.
      expect(unterkunft.stichwort).toBe("Abrufkontingent, Stichwort: Konrad-Adenauer-Stiftung");
      expect(unterkunft.web).toMatch(/^https:\/\//);
    },
  );

  /**
   * Ein Bild je Hotel, verkleinert unter src/assets/unterkuenfte/ - nie das
   * Original aus der Ablage des Orga-Teams. Ohne Beschreibung fehlte
   * Screenreadern der Alternativtext.
   */
  it.each(unterkuenfte.map((u) => [u.name, u] as const))(
    "%s hat ein Bild mit Beschreibung",
    (_name, unterkunft) => {
      expect(unterkunft.bild).toMatch(/^\.\.\/assets\/unterkuenfte\/[a-z0-9-]+\.jpg$/);
      expect(unterkunft.bildbeschreibung).toBeTruthy();
    },
  );

  /** Wie viele Zimmer reserviert sind, ist für Teilnehmende ohne Belang (28.11.2026). */
  it("nennen keine reservierten Zimmerzahlen und keine Verfallsfrist", () => {
    const text = JSON.stringify(unterkuenfte);

    expect(text).not.toMatch(/"anzahl"|verfällt/);
  });

  /** Kampagnen- und Klick-Kennungen verraten Dritten, woher jemand kommt. */
  it.each(unterkuenfte.map((u) => [u.name, u.web ?? ""] as const))(
    "Buchungslink von %s enthält keine Tracking-Parameter",
    (_name, web) => {
      expect(web).not.toMatch(/[?&](utm_|gclid|gclsrc|msclkid|fbclid)/);
    },
  );

  it.each(unterkuenfte.map((u) => [u.name, u.ortId] as const))(
    "%s verweist auf einen gepflegten Ort",
    (_name, ortId) => {
      expect(ortIds.has(ortId ?? ""), `${ortId} fehlt in orte.json`).toBe(true);
    },
  );
});
