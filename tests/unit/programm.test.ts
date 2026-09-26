import { describe, expect, it } from "vitest";

import {
  formatiereDatum,
  formatiereZeitraum,
  nachTagenGruppieren,
  tagesSchluessel,
  type Programmpunkt,
} from "../../src/lib/programm.ts";

const punkt = (teil: Partial<Programmpunkt> & Pick<Programmpunkt, "id">): Programmpunkt => ({
  titel: "Beispiel",
  spur: "haupt",
  status: "bestaetigt",
  optional: false,
  personen: [],
  ...teil,
});

describe("tagesSchluessel", () => {
  it("nimmt den Tag des Beginns", () => {
    expect(tagesSchluessel(punkt({ id: "a", beginn: "2027-05-06T13:00" }))).toBe("2027-05-06");
  });

  /**
   * Der Niedersaechsische Abend geht bis 01:00, der Festabend bis 03:00. Wer sie
   * dem Folgetag zuordnet, zeigt am Sonntagmorgen einen Programmpunkt an, der in
   * Wahrheit zum Samstag gehoert.
   */
  it("ordnet Punkte ueber Mitternacht dem Starttag zu", () => {
    const festabend = punkt({
      id: "festabend",
      beginn: "2027-05-08T19:00",
      ende: "2027-05-09T03:00",
    });

    expect(tagesSchluessel(festabend)).toBe("2027-05-08");
  });

  it("liefert null fuer Punkte ohne Beginn", () => {
    expect(tagesSchluessel(punkt({ id: "offen", zeitHinweis: "Zeit noch offen" }))).toBeNull();
  });
});

describe("nachTagenGruppieren", () => {
  const punkte = [
    punkt({ id: "spaet", beginn: "2027-05-06T19:00" }),
    punkt({ id: "frueh", beginn: "2027-05-06T11:30" }),
    punkt({ id: "anderer-tag", beginn: "2027-05-07T10:00" }),
    punkt({ id: "ohne-zeit", zeitHinweis: "Zeit noch offen" }),
  ];

  it("gruppiert nach Tag, in zeitlicher Reihenfolge", () => {
    const { tage } = nachTagenGruppieren(punkte);

    expect(tage.map((t) => t.datum)).toEqual(["2027-05-06", "2027-05-07"]);
    expect(tage[0]!.punkte.map((p) => p.id)).toEqual(["frueh", "spaet"]);
  });

  /**
   * Punkte ohne Zeit duerfen nicht verschwinden - "Partnerprogramm" ist ein
   * echter Programmpunkt, nur eben noch ohne Termin (Produktprinzip 1).
   */
  it("haelt Punkte ohne Zeit getrennt, statt sie zu verwerfen", () => {
    const { ohneZeit } = nachTagenGruppieren(punkte);

    expect(ohneZeit.map((p) => p.id)).toEqual(["ohne-zeit"]);
  });

  it("sortiert bei gleichem Beginn stabil nach Titel", () => {
    const { tage } = nachTagenGruppieren([
      punkt({ id: "b", titel: "Zweiter", beginn: "2027-05-07T12:30" }),
      punkt({ id: "a", titel: "Erster", beginn: "2027-05-07T12:30" }),
    ]);

    expect(tage[0]!.punkte.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("kommt mit einer leeren Liste zurecht", () => {
    const { tage, ohneZeit } = nachTagenGruppieren([]);
    expect(tage).toEqual([]);
    expect(ohneZeit).toEqual([]);
  });
});

describe("formatiereDatum", () => {
  it("nennt Wochentag und Datum ausgeschrieben (Regel 49)", () => {
    expect(formatiereDatum("2027-05-06")).toBe("Donnerstag, 6. Mai 2027");
  });

  /**
   * Ohne feste Zeitzone verschiebt sich das Datum je nach Serverzeit um einen Tag -
   * der Build laeuft in der CI unter UTC, die Entwicklung in Europe/Berlin.
   */
  it("verschiebt sich nicht durch die Zeitzone des Rechners", () => {
    expect(formatiereDatum("2027-05-09")).toContain("9. Mai");
    expect(formatiereDatum("2027-01-01")).toContain("1. Januar");
  });
});

describe("formatiereZeitraum", () => {
  it("nennt Beginn und Ende mit Einheit", () => {
    expect(
      formatiereZeitraum(punkt({ id: "a", beginn: "2027-05-06T13:00", ende: "2027-05-06T13:30" })),
    ).toBe("13:00–13:30 Uhr");
  });

  it("nennt bei fehlendem Ende nur den Beginn", () => {
    expect(formatiereZeitraum(punkt({ id: "a", beginn: "2027-05-07T21:00" }))).toBe("ab 21:00 Uhr");
  });

  it("weist auf den Folgetag hin, wenn ein Punkt ueber Mitternacht geht", () => {
    expect(
      formatiereZeitraum(punkt({ id: "a", beginn: "2027-05-08T19:00", ende: "2027-05-09T03:00" })),
    ).toBe("19:00–03:00 Uhr (am Folgetag)");
  });

  it("bevorzugt einen ausdruecklichen Zeithinweis", () => {
    expect(
      formatiereZeitraum(
        punkt({ id: "a", beginn: "2027-05-05T19:00", zeitHinweis: "ab 19:00 Uhr" }),
      ),
    ).toBe("ab 19:00 Uhr");
  });

  it("liefert den Hinweis auch ohne jede Zeitangabe", () => {
    expect(formatiereZeitraum(punkt({ id: "a", zeitHinweis: "Zeit noch offen" }))).toBe(
      "Zeit noch offen",
    );
  });
});
