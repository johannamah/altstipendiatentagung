import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** Teilnahmeoptionen laut Orga-Team vom 28.11.2026; die Beitraege folgen. */
const optionen: {
  id: string;
  gruppe: string;
  umfang?: string;
  beitragMitglied?: string;
  beitragNichtMitglied?: string;
}[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../src/content/teilnahme.json", import.meta.url)), "utf8"),
);

describe("Teilnahmeoptionen", () => {
  it("stehen in der vorgegebenen Reihenfolge", () => {
    expect(optionen.map((o) => [o.gruppe, o.umfang ?? null])).toEqual([
      ["Altstipendiaten", "Ganze Tagung"],
      ["Altstipendiaten", "Tagung ohne Festabend"],
      ["Altstipendiaten", "Nur Festabend"],
      ["Stipendiaten | Stipendiatenbeirat", null],
      ["Chor und Orchester", "Nur Festabend"],
    ]);
  });

  /** Ein "xxx" oder "[Betrag]" darf nie als Preis erscheinen. */
  it("nennen Beiträge nur als Eurobetrag", () => {
    for (const option of optionen) {
      for (const beitrag of [option.beitragMitglied, option.beitragNichtMitglied]) {
        if (beitrag !== undefined) expect(beitrag, option.id).toMatch(/^\d+(,\d{2})? €$/);
      }
    }
  });
});
