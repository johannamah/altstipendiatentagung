import { describe, expect, it } from "vitest";

import { formatiereStand, formatiereVorlauf, naechsteLage } from "../../src/lib/jetzt.ts";
import type { Programmpunkt } from "../../src/lib/programm.ts";

const punkt = (id: string, beginn?: string, ende?: string): Programmpunkt => ({
  id,
  titel: id,
  beginn,
  ende,
  spur: "haupt",
  status: "bestaetigt",
  optional: false,
  personen: [],
});

const programm = [
  punkt("auftakt", "2027-05-05T19:00", "2027-05-05T22:00"),
  punkt("registrierung", "2027-05-06T11:30", "2027-05-06T13:00"),
  punkt("panel", "2027-05-07T10:00", "2027-05-07T11:30"),
  punkt("exkursion-a", "2027-05-07T12:30", "2027-05-07T17:00"),
  punkt("exkursion-b", "2027-05-07T12:30", "2027-05-07T17:00"),
  punkt("abschluss", "2027-05-09T12:00", "2027-05-09T13:30"),
];

describe("naechsteLage", () => {
  it("zeigt vor der Tagung den ersten Programmpunkt", () => {
    const lage = naechsteLage(programm, "2026-11-01T09:00");

    expect(lage.art).toBe("vorher");
    expect(lage.punkte.map((p) => p.id)).toEqual(["auftakt"]);
  });

  it("zeigt waehrend eines Punktes diesen als laufend", () => {
    const lage = naechsteLage(programm, "2027-05-07T10:45");

    expect(lage.art).toBe("jetzt");
    expect(lage.punkte.map((p) => p.id)).toEqual(["panel"]);
  });

  /** Am Freitag laufen sieben Exkursionen gleichzeitig - das muss erkennbar sein. */
  it("nennt alle gleichzeitig laufenden Punkte", () => {
    const lage = naechsteLage(programm, "2027-05-07T14:00");

    expect(lage.art).toBe("jetzt");
    expect(lage.punkte.map((p) => p.id)).toEqual(["exkursion-a", "exkursion-b"]);
  });

  it("zeigt in einer Pause den naechsten Punkt", () => {
    const lage = naechsteLage(programm, "2027-05-07T11:45");

    expect(lage.art).toBe("gleich");
    expect(lage.punkte.map((p) => p.id)).toEqual(["exkursion-a", "exkursion-b"]);
  });

  /**
   * Nach der Tagung einen vergangenen Termin zu zeigen waere irrefuehrend -
   * besser steht dort, dass sie vorbei ist (Produktprinzip 1).
   */
  it("sagt nach der Tagung, dass sie vorbei ist", () => {
    const lage = naechsteLage(programm, "2027-06-01T09:00");

    expect(lage.art).toBe("vorbei");
    expect(lage.punkte).toEqual([]);
  });

  it("kommt mit einem leeren Programm zurecht", () => {
    expect(naechsteLage([], "2027-05-07T10:45")).toEqual({ art: "vorbei", punkte: [] });
  });

  /** Punkte ohne Zeitangabe gehoeren nicht auf eine Karte, die "jetzt" sagt. */
  it("uebergeht Punkte ohne Zeitangabe", () => {
    const lage = naechsteLage([punkt("ohne-zeit"), ...programm], "2026-11-01T09:00");

    expect(lage.punkte.map((p) => p.id)).toEqual(["auftakt"]);
  });
});

describe("formatiereVorlauf", () => {
  it("zaehlt Minuten, solange es weniger als eine Stunde ist", () => {
    expect(formatiereVorlauf("2027-05-07T09:42", "2027-05-07T10:00")).toBe("in 18 Min.");
  });

  it("nennt eine einzelne Minute im Singular", () => {
    expect(formatiereVorlauf("2027-05-07T09:59", "2027-05-07T10:00")).toBe("in 1 Min.");
  });

  it("zaehlt Stunden, solange es derselbe Tag ist", () => {
    expect(formatiereVorlauf("2027-05-07T07:00", "2027-05-07T10:00")).toBe("in 3 Std.");
  });

  it("rundet Stunden ab, statt zu schmeicheln", () => {
    // 2 Stunden 50 Minuten sind "in 2 Std." - wer zu frueh losgeht, kommt an.
    expect(formatiereVorlauf("2027-05-07T07:10", "2027-05-07T10:00")).toBe("in 2 Std.");
  });

  it("nennt bei groesserem Abstand den Wochentag", () => {
    expect(formatiereVorlauf("2027-05-05T10:00", "2027-05-07T10:00")).toBe("am Freitag");
  });

  it("liefert nichts, wenn der Zeitpunkt schon vorbei ist", () => {
    expect(formatiereVorlauf("2027-05-07T10:30", "2027-05-07T10:00")).toBeNull();
  });
});

describe("formatiereStand", () => {
  it("nennt Tag, Monat und Uhrzeit", () => {
    expect(formatiereStand("2027-05-05T09:32")).toBe("5. Mai, 09:32 Uhr");
  });

  it("verschiebt sich nicht durch die Zeitzone des Rechners", () => {
    expect(formatiereStand("2027-01-01T00:05")).toBe("1. Januar, 00:05 Uhr");
  });
});
