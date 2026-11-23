import { describe, expect, it } from "vitest";

import { inAbsaetze } from "../../src/lib/text.ts";

/**
 * Die Programmtexte des Orga-Teams bestehen aus mehreren Absaetzen
 * (Einordnung, Leitfragen, "Was erwartet Dich?"). In einem einzigen <p>
 * liefen sie zu einem Block zusammen, den am Handy niemand liest.
 */
describe("inAbsaetze", () => {
  it("trennt an Leerzeilen", () => {
    expect(inAbsaetze("Erster Absatz.\n\nZweiter Absatz.")).toEqual([
      "Erster Absatz.",
      "Zweiter Absatz.",
    ]);
  });

  it("laesst einen Text ohne Leerzeile unveraendert", () => {
    expect(inAbsaetze("Nur ein Absatz.")).toEqual(["Nur ein Absatz."]);
  });

  it("verwirft leere Absaetze und Raender", () => {
    expect(inAbsaetze("  Eins. \n\n\n\n Zwei.\n")).toEqual(["Eins.", "Zwei."]);
  });
});
