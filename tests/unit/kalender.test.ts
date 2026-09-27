import { describe, expect, it } from "vitest";

import { alsKalender, istExportierbar } from "../../src/lib/kalender.ts";
import type { Programmpunkt } from "../../src/lib/programm.ts";

const punkt = (teil: Partial<Programmpunkt> & Pick<Programmpunkt, "id">): Programmpunkt => ({
  titel: "Beispiel",
  spur: "haupt",
  status: "bestaetigt",
  optional: false,
  personen: [],
  ...teil,
});

const zeilen = (ics: string) => ics.split("\r\n");

describe("istExportierbar", () => {
  it("verlangt Beginn und Ende", () => {
    expect(
      istExportierbar(punkt({ id: "a", beginn: "2027-05-07T12:30", ende: "2027-05-07T17:00" })),
    ).toBe(true);
  });

  /**
   * Ein Termin ohne Ende oder ohne Zeit wuerde im Kalender eine erfundene Dauer
   * bekommen. Lieber kein Knopf als ein falscher Eintrag (Produktprinzip 1).
   */
  it("lehnt Punkte ohne belastbare Zeit ab", () => {
    expect(istExportierbar(punkt({ id: "a", beginn: "2027-05-07T21:00" }))).toBe(false);
    expect(istExportierbar(punkt({ id: "a", zeitHinweis: "Zeit noch offen" }))).toBe(false);
  });
});

describe("alsKalender", () => {
  const beispiel = punkt({
    id: "exkursion-fagus",
    titel: "Industriekultur trifft Zukunft",
    beginn: "2027-05-07T12:30",
    ende: "2027-05-07T17:00",
    ort: "Fagus-Werk",
    adresse: "Hannoversche Str. 58, 31061 Alfeld (Leine)",
  });

  it("erzeugt einen vollstaendigen Kalender", () => {
    const z = zeilen(alsKalender([beispiel]));

    expect(z[0]).toBe("BEGIN:VCALENDAR");
    // Die letzte Zeile ist leer, weil der Inhalt mit CRLF endet.
    expect(z.at(-2)).toBe("END:VCALENDAR");
    expect(z).toContain("VERSION:2.0");
    expect(z).toContain("BEGIN:VEVENT");
    expect(z).toContain("END:VEVENT");
  });

  /**
   * RFC 5545 verlangt CRLF als Zeilenende - und zwar auch nach der letzten
   * Zeile. Ein einzelnes LF laesst manche Kalender die Datei ablehnen.
   */
  it("trennt alle Zeilen mit CRLF und endet mit CRLF", () => {
    const ics = alsKalender([beispiel]);

    expect(ics.endsWith("\r\n")).toBe(true);
    // Kein LF ohne vorangehendes CR.
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  /**
   * In UTC, nicht als schwebende Zeit: Sonst liegt der Termin im Kalender je
   * nach Geraeteeinstellung um Stunden daneben. 12:30 Uhr Berlin im Mai
   * (Sommerzeit) sind 10:30 Uhr UTC.
   */
  it("exportiert Zeiten in UTC", () => {
    const z = zeilen(alsKalender([beispiel]));

    expect(z).toContain("DTSTART:20270507T103000Z");
    expect(z).toContain("DTEND:20270507T150000Z");
  });

  it("nutzt eine stabile, aus der Kennung abgeleitete UID", () => {
    const einmal = alsKalender([beispiel]);
    const nochmal = alsKalender([beispiel]);

    expect(zeilen(einmal).find((z) => z.startsWith("UID:"))).toContain("exkursion-fagus");
    expect(zeilen(einmal).find((z) => z.startsWith("UID:"))).toBe(
      zeilen(nochmal).find((z) => z.startsWith("UID:")),
    );
  });

  it("nennt Ort und Adresse zusammen", () => {
    expect(alsKalender([beispiel])).toContain("Fagus-Werk");
    expect(alsKalender([beispiel])).toContain("Hannoversche Str. 58");
  });

  /**
   * Der eigentliche Stolperstein: Komma, Semikolon und Backslash trennen in
   * iCalendar Felder. Unmaskiert zerreisst ein Titel wie
   * "Glaube, Werte, Europa" den Eintrag.
   */
  it("maskiert Sonderzeichen in Texten", () => {
    const heikel = punkt({
      id: "heikel",
      titel: "Glaube, Werte; Europa \\ Test",
      beginn: "2027-05-07T12:30",
      ende: "2027-05-07T17:00",
    });

    const zeile = zeilen(alsKalender([heikel]))
      .join("")
      .replace(/\r\n /g, "");

    expect(zeile).toContain("Glaube\\, Werte\\; Europa \\\\ Test");
  });

  it("maskiert Zeilenumbrueche in Beschreibungen", () => {
    const mehrzeilig = punkt({
      id: "mehrzeilig",
      titel: "Test",
      beschreibung: "Erste Zeile\nZweite Zeile",
      beginn: "2027-05-07T12:30",
      ende: "2027-05-07T17:00",
    });

    expect(alsKalender([mehrzeilig])).toContain("Erste Zeile\\nZweite Zeile");
  });

  /**
   * RFC 5545 begrenzt Zeilen auf 75 Oktette. Laengere Zeilen werden gefaltet,
   * die Fortsetzung beginnt mit einem Leerzeichen. Ohne das lehnen manche
   * Kalender die Datei stillschweigend ab.
   */
  it("faltet zu lange Zeilen", () => {
    const lang = punkt({
      id: "lang",
      titel:
        "Ein ausgesprochen langer Programmtitel, der die Grenze von fuenfundsiebzig Oktetten deutlich ueberschreitet",
      beginn: "2027-05-07T12:30",
      ende: "2027-05-07T17:00",
    });

    const z = zeilen(alsKalender([lang]));

    for (const zeile of z) {
      expect(new TextEncoder().encode(zeile).length).toBeLessThanOrEqual(75);
    }
    expect(z.some((zeile) => zeile.startsWith(" "))).toBe(true);
  });

  it("nimmt mehrere Punkte in eine Datei auf", () => {
    const zweiter = punkt({
      id: "zweiter",
      titel: "Zweiter Punkt",
      beginn: "2027-05-08T13:00",
      ende: "2027-05-08T14:30",
    });

    const z = zeilen(alsKalender([beispiel, zweiter]));

    expect(z.filter((zeile) => zeile === "BEGIN:VEVENT")).toHaveLength(2);
  });

  it("ueberspringt Punkte ohne belastbare Zeit, statt sie zu erfinden", () => {
    const ics = alsKalender([beispiel, punkt({ id: "offen", zeitHinweis: "Zeit noch offen" })]);

    expect(zeilen(ics).filter((z) => z === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("weist unbestaetigte Punkte als vorlaeufig aus", () => {
    const vorlaeufig = punkt({
      id: "vorlaeufig",
      titel: "Noch offen",
      status: "vorlaeufig",
      beginn: "2027-05-08T13:00",
      ende: "2027-05-08T14:30",
    });

    expect(alsKalender([vorlaeufig])).toContain("STATUS:TENTATIVE");
    expect(alsKalender([beispiel])).toContain("STATUS:CONFIRMED");
  });
});
