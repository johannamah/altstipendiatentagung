import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { AUSGANGSORT_ID, WEGE_IM_STADTPLAN } from "../../src/daten/stadtplan.ts";

/**
 * Die Wegliste ist die Textalternative zum illustrierten Stadtplan. Sie
 * verweist auf Orte aus orte.json; ein Tippfehler in einer Kennung liesse den
 * Bau scheitern oder - schlimmer - einen Ort stillschweigend fehlen.
 */
const orte: { id: string; art: string }[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../src/content/orte.json", import.meta.url)), "utf8"),
);
const bekannt = new Set(orte.map((ort) => ort.id));

describe("Wege im Stadtplan", () => {
  it("gehen vom Tagungsort aus", () => {
    expect(orte.find((ort) => ort.id === AUSGANGSORT_ID)?.art).toBe("tagungsort");
  });

  it("verweisen nur auf bekannte Orte", () => {
    const unbekannt = WEGE_IM_STADTPLAN.map((weg) => weg.ortId).filter((id) => !bekannt.has(id));

    expect(unbekannt).toEqual([]);
  });

  it("nennen jeden Ort nur einmal", () => {
    const ids = WEGE_IM_STADTPLAN.map((weg) => weg.ortId);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("führen nicht zum Ausgangsort selbst", () => {
    expect(WEGE_IM_STADTPLAN.map((weg) => weg.ortId)).not.toContain(AUSGANGSORT_ID);
  });
});
