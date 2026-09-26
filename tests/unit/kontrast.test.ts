import { describe, expect, it } from "vitest";

import { kontrastVerhaeltnis, relativeLeuchtdichte } from "../../src/lib/kontrast.ts";

/**
 * Referenzwerte stammen aus der WCAG-2.2-Definition selbst, nicht aus unserer
 * Implementierung - sonst wuerde der Test nur bestaetigen, was der Code ohnehin tut.
 */
describe("relativeLeuchtdichte", () => {
  it("liefert 0 fuer Schwarz und 1 fuer Weiss", () => {
    expect(relativeLeuchtdichte("#000000")).toBe(0);
    expect(relativeLeuchtdichte("#FFFFFF")).toBe(1);
  });

  it("wendet die Gammakorrektur an, rechnet also nicht linear", () => {
    // Mittleres Grau sieht halb so hell aus, ist es physikalisch aber nicht.
    expect(relativeLeuchtdichte("#808080")).toBeCloseTo(0.2159, 3);
  });

  it("akzeptiert Kurzschreibweise und Grossschreibung gleichermassen", () => {
    expect(relativeLeuchtdichte("#fff")).toBe(relativeLeuchtdichte("#FFFFFF"));
  });

  it("weist ungueltige Farbwerte zurueck, statt still 0 zu liefern", () => {
    expect(() => relativeLeuchtdichte("rot")).toThrow(/Farbwert/);
    expect(() => relativeLeuchtdichte("#12345")).toThrow(/Farbwert/);
  });
});

describe("kontrastVerhaeltnis", () => {
  it("liefert den Hoechstwert 21:1 fuer Schwarz auf Weiss", () => {
    expect(kontrastVerhaeltnis("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("liefert 1:1 fuer zwei gleiche Farben", () => {
    expect(kontrastVerhaeltnis("#004684", "#004684")).toBeCloseTo(1, 5);
  });

  it("ist symmetrisch - die Reihenfolge der Argumente aendert nichts", () => {
    const a = kontrastVerhaeltnis("#004684", "#FFFFFF");
    const b = kontrastVerhaeltnis("#FFFFFF", "#004684");
    expect(a).toBeCloseTo(b, 10);
  });

  it("bestaetigt den im Entwurf dokumentierten Kontrastbefund", () => {
    // index.html begruendet den Wechsel von #D97F00 auf #9C5A00 auf Hintergrund
    // #FFF1DA mit 2,7:1 bzw. 4,9:1. Dieser Test haelt die Begruendung nachpruefbar.
    expect(kontrastVerhaeltnis("#D97F00", "#FFF1DA")).toBeCloseTo(2.7, 1);
    expect(kontrastVerhaeltnis("#9C5A00", "#FFF1DA")).toBeCloseTo(4.9, 1);
  });
});
