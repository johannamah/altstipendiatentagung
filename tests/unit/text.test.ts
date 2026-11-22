import { describe, expect, it } from "vitest";

import { inAbsaetze, telefonVerweis } from "../../src/lib/text.ts";

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

describe("Telefonverweis", () => {
  /** So stehen die Nummern in den Unterlagen der Hotels - jede muss waehlbar sein. */
  it.each([
    ["+49 (0) 51 21 – 179 29 0", "tel:+495121179290"],
    ["+49 (0) 5121 912 870 0", "tel:+4951219128700"],
    ["+49 6146 815350-7", "tel:+4961468153507"],
    ["05121 93593-55", "tel:+4951219359355"],
    ["030 23000-322", "tel:+493023000322"],
  ])("%s wird zu %s", (nummer, verweis) => {
    expect(telefonVerweis(nummer)).toBe(verweis);
  });
});
