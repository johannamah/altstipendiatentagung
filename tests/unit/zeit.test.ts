import { describe, expect, it } from "vitest";

import { jetztAlsOrtszeit, laufendUm, ortszeitZuUtc } from "../../src/lib/zeit.ts";
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

describe("jetztAlsOrtszeit", () => {
  /**
   * Der Kniff, der die gesamte Zeitzonenrechnung erspart: Statt die
   * Programmzeiten in Zeitstempel umzurechnen, wird der aktuelle Zeitpunkt in
   * dieselbe Schreibweise gebracht. Danach genuegt ein Zeichenkettenvergleich.
   */
  it("formt einen Zeitstempel in Ortszeit um", () => {
    // 07.05.2027, 10:30 UTC = 12:30 Uhr in Berlin (Sommerzeit).
    const utc = Date.UTC(2027, 4, 7, 10, 30);
    expect(jetztAlsOrtszeit(new Date(utc))).toBe("2027-05-07T12:30");
  });

  it("beachtet die Winterzeit", () => {
    // 01.01.2027, 11:30 UTC = 12:30 Uhr in Berlin (Normalzeit).
    const utc = Date.UTC(2027, 0, 1, 11, 30);
    expect(jetztAlsOrtszeit(new Date(utc))).toBe("2027-01-01T12:30");
  });
});

describe("ortszeitZuUtc", () => {
  it("rechnet Sommerzeit korrekt um (UTC+2)", () => {
    expect(ortszeitZuUtc("2027-05-07T12:30")).toBe(Date.UTC(2027, 4, 7, 10, 30));
  });

  it("rechnet Winterzeit korrekt um (UTC+1)", () => {
    expect(ortszeitZuUtc("2027-01-01T12:30")).toBe(Date.UTC(2027, 0, 1, 11, 30));
  });

  it("ist zur Rueckrichtung stimmig", () => {
    const ortszeit = "2027-05-08T19:00";
    expect(jetztAlsOrtszeit(new Date(ortszeitZuUtc(ortszeit)))).toBe(ortszeit);
  });
});

describe("laufendUm", () => {
  const programm = [
    punkt("vormittag", "2027-05-07T10:00", "2027-05-07T11:30"),
    punkt("imbiss", "2027-05-07T11:30", "2027-05-07T12:30"),
    punkt("exkursion-a", "2027-05-07T12:30", "2027-05-07T17:00"),
    punkt("exkursion-b", "2027-05-07T12:30", "2027-05-07T17:00"),
    punkt("weinfest", "2027-05-07T21:00"), // ohne Ende
    punkt("ohne-zeit"),
  ];

  it("findet den laufenden Punkt", () => {
    const { laufend, naechster } = laufendUm(programm, "2027-05-07T10:45");

    expect(laufend.map((p) => p.id)).toEqual(["vormittag"]);
    expect(naechster?.id).toBe("imbiss");
  });

  it("nennt alle gleichzeitig laufenden Punkte", () => {
    const { laufend } = laufendUm(programm, "2027-05-07T14:00");

    expect(laufend.map((p) => p.id)).toEqual(["exkursion-a", "exkursion-b"]);
  });

  /** Am Beginn laeuft ein Punkt bereits, am Ende nicht mehr. */
  it("behandelt die Grenzen eindeutig", () => {
    expect(laufendUm(programm, "2027-05-07T10:00").laufend.map((p) => p.id)).toEqual(["vormittag"]);
    expect(laufendUm(programm, "2027-05-07T11:30").laufend.map((p) => p.id)).toEqual(["imbiss"]);
  });

  /**
   * In einer Pause soll der NAECHSTE Punkt hervorgehoben werden, nicht der
   * letzte - wer auf das Telefon schaut, will wissen, wo er hinmuss.
   */
  it("hebt in einer Pause den naechsten Punkt hervor", () => {
    const { laufend, naechster } = laufendUm(programm, "2027-05-07T19:00");

    expect(laufend).toEqual([]);
    expect(naechster?.id).toBe("weinfest");
  });

  it("markiert nichts vor der Tagung", () => {
    const { laufend, naechster } = laufendUm(programm, "2027-05-01T09:00");

    expect(laufend).toEqual([]);
    expect(naechster).toBeNull();
  });

  it("markiert nichts nach der Tagung", () => {
    const { laufend, naechster } = laufendUm(programm, "2027-06-01T09:00");

    expect(laufend).toEqual([]);
    expect(naechster).toBeNull();
  });

  /**
   * Ein Punkt ohne Endzeit gilt nicht als laufend - wann er endet, wissen wir
   * nicht, und eine erfundene Dauer waere schlimmer als keine Markierung
   * (Produktprinzip 1).
   */
  it("markiert Punkte ohne Endzeit nicht als laufend", () => {
    const { laufend } = laufendUm(programm, "2027-05-07T22:00");

    expect(laufend).toEqual([]);
  });

  it("uebergeht Punkte ohne Zeitangabe", () => {
    const { laufend, naechster } = laufendUm(programm, "2027-05-07T10:45");

    expect([...laufend, naechster].some((p) => p?.id === "ohne-zeit")).toBe(false);
  });

  it("kommt mit einem leeren Programm zurecht", () => {
    expect(laufendUm([], "2027-05-07T10:45")).toEqual({ laufend: [], naechster: null });
  });
});
