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
