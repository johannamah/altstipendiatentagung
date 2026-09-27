import { describe, expect, it } from "vitest";

import { alsAchse, minutenImTag, ordneStraengeZu, tagesFenster } from "../../src/lib/zeitachse.ts";
import type { Programmpunkt } from "../../src/lib/programm.ts";

const punkt = (id: string, beginn: string, ende?: string): Programmpunkt => ({
  id,
  titel: id,
  beginn,
  ende,
  spur: "haupt",
  status: "bestaetigt",
  optional: false,
  personen: [],
});

describe("minutenImTag", () => {
  it("zaehlt Minuten seit Mitternacht des Bezugstags", () => {
    expect(minutenImTag("2027-05-07T00:00", "2027-05-07")).toBe(0);
    expect(minutenImTag("2027-05-07T12:30", "2027-05-07")).toBe(750);
  });

  /**
   * Der Festabend beginnt am Samstag um 19:00 und endet am Sonntag um 03:00.
   * Auf der Achse des Samstags ist das Minute 1140 bis Minute 1620 - nicht
   * 1140 bis 180, sonst laeuft der Balken rueckwaerts.
   */
  it("rechnet ueber Mitternacht hinaus weiter", () => {
    expect(minutenImTag("2027-05-09T03:00", "2027-05-08")).toBe(24 * 60 + 180);
  });
});

describe("tagesFenster", () => {
  it("umschliesst alle Punkte, auf volle Stunden gerundet", () => {
    const fenster = tagesFenster(
      [
        punkt("a", "2027-05-07T10:15", "2027-05-07T11:30"),
        punkt("b", "2027-05-07T12:30", "2027-05-07T17:00"),
      ],
      "2027-05-07",
    );

    expect(fenster).toEqual({ von: 10 * 60, bis: 17 * 60 });
  });

  it("gibt einem Punkt ohne Ende eine sichtbare Mindestdauer", () => {
    const fenster = tagesFenster([punkt("a", "2027-05-07T21:00")], "2027-05-07");

    expect(fenster.von).toBe(21 * 60);
    expect(fenster.bis).toBeGreaterThan(21 * 60);
  });
});

describe("ordneStraengeZu", () => {
  it("legt aufeinanderfolgende Punkte in denselben Strang", () => {
    const { zuordnung, straenge } = ordneStraengeZu(
      [
        punkt("frueh", "2027-05-07T10:00", "2027-05-07T11:30"),
        punkt("spaet", "2027-05-07T11:30", "2027-05-07T12:30"),
      ],
      "2027-05-07",
    );

    expect(straenge).toBe(1);
    expect(zuordnung.get("frueh")).toBe(0);
    expect(zuordnung.get("spaet")).toBe(0);
  });

  /** Das eigentliche Ziel: Gleichzeitiges steht nebeneinander. */
  it("verteilt gleichzeitige Punkte auf eigene Straenge", () => {
    const { zuordnung, straenge } = ordneStraengeZu(
      [
        punkt("a", "2027-05-07T12:30", "2027-05-07T17:00"),
        punkt("b", "2027-05-07T12:30", "2027-05-07T17:00"),
        punkt("c", "2027-05-07T12:30", "2027-05-07T17:00"),
      ],
      "2027-05-07",
    );

    expect(straenge).toBe(3);
    expect([zuordnung.get("a"), zuordnung.get("b"), zuordnung.get("c")].sort()).toEqual([0, 1, 2]);
  });

  /**
   * Nicht mehr Straenge als noetig: Sonst wird die Achse unnoetig breit und
   * auf dem Smartphone unbenutzbar.
   */
  it("nutzt einen frei gewordenen Strang wieder", () => {
    const { straenge, zuordnung } = ordneStraengeZu(
      [
        punkt("a", "2027-05-07T10:00", "2027-05-07T11:00"),
        punkt("b", "2027-05-07T10:00", "2027-05-07T11:00"),
        punkt("c", "2027-05-07T11:00", "2027-05-07T12:00"),
      ],
      "2027-05-07",
    );

    expect(straenge).toBe(2);
    expect(zuordnung.get("c")).toBe(0);
  });

  it("erkennt echte Ueberschneidungen, nicht nur exakte Gleichzeitigkeit", () => {
    // Genau der Fall aus dem Programm: Mittagsimbiss ueberlappt die letzten
    // Vortraege des Studium Generale.
    const { straenge } = ordneStraengeZu(
      [
        punkt("vortrag", "2027-05-08T11:30", "2027-05-08T12:00"),
        punkt("imbiss", "2027-05-08T11:45", "2027-05-08T13:00"),
      ],
      "2027-05-08",
    );

    expect(straenge).toBe(2);
  });

  it("behandelt Beruehrung an den Grenzen nicht als Ueberschneidung", () => {
    const { straenge } = ordneStraengeZu(
      [
        punkt("a", "2027-05-07T10:00", "2027-05-07T11:00"),
        punkt("b", "2027-05-07T11:00", "2027-05-07T12:00"),
      ],
      "2027-05-07",
    );

    expect(straenge).toBe(1);
  });

  it("ordnet in stabiler Reihenfolge zu", () => {
    const eingabe = [
      punkt("zweiter", "2027-05-07T12:30", "2027-05-07T17:00"),
      punkt("erster", "2027-05-07T12:30", "2027-05-07T17:00"),
    ];

    expect(ordneStraengeZu(eingabe, "2027-05-07").zuordnung).toEqual(
      ordneStraengeZu(eingabe, "2027-05-07").zuordnung,
    );
  });

  it("kommt mit einem leeren Tag zurecht", () => {
    const { straenge, zuordnung } = ordneStraengeZu([], "2027-05-07");

    expect(straenge).toBe(0);
    expect(zuordnung.size).toBe(0);
  });
});

describe("alsAchse", () => {
  const tag = [
    punkt("a", "2027-05-07T12:30", "2027-05-07T17:00"),
    punkt("b", "2027-05-07T12:30", "2027-05-07T17:00"),
  ];

  /**
   * Die erste Rasterspalte gehoert der Stundenskala, die Straenge beginnen bei
   * Spalte 2. Der Versatz wird hier gerechnet und nicht per calc() im CSS:
   * calc() in Grid-Linienangaben wird nicht zuverlaessig unterstuetzt, und
   * faellt die Angabe aus, landen alle Eintraege stillschweigend in der
   * automatischen Platzierung - sichtbar wird das erst als kaputtes Layout.
   */
  it("versetzt die Straenge um die Spalte der Stundenskala", () => {
    const { eintraege } = alsAchse(tag, "2027-05-07");
    const spalten = eintraege.map((e) => e.spalte).sort();

    expect(spalten).toEqual([2, 3]);
    expect(Math.min(...spalten)).toBeGreaterThanOrEqual(2);
  });

  it("gibt jedem Eintrag mindestens eine Rasterzeile Hoehe", () => {
    const { eintraege } = alsAchse(
      [punkt("kurz", "2027-05-07T12:30", "2027-05-07T12:31")],
      "2027-05-07",
    );

    expect(eintraege[0]!.zeileBis).toBeGreaterThan(eintraege[0]!.zeileVon);
  });
});
