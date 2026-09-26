/**
 * Zeitrechnung fuer das Programm.
 *
 * Grundidee: Die Programmzeiten bleiben Zeichenketten in Ortszeit. Statt sie in
 * Zeitstempel umzurechnen, wird der AKTUELLE Zeitpunkt in dieselbe Schreibweise
 * gebracht - danach genuegt ein Zeichenkettenvergleich. Das erspart die gesamte
 * Zeitzonenrechnung an der Stelle, an der sie am leichtesten schiefgeht.
 *
 * Echte Umrechnung braucht nur der Kalender-Export, und nur dort steht sie.
 */

import type { Programmpunkt } from "./programm.ts";

export const ZEITZONE = "Europe/Berlin";

const TEILE = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZEITZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Zerlegt einen Zeitpunkt in die Felder, die er in der Zielzeitzone hat. */
function felder(zeitpunkt: Date): Record<string, number> {
  const ergebnis: Record<string, number> = {};

  for (const teil of TEILE.formatToParts(zeitpunkt)) {
    if (teil.type !== "literal") {
      // "24:00" kommt in manchen Umgebungen fuer Mitternacht - auf 0 normieren.
      ergebnis[teil.type] = teil.value === "24" ? 0 : Number(teil.value);
    }
  }

  return ergebnis;
}

const zweistellig = (wert: number) => String(wert).padStart(2, "0");

/**
 * Formt einen Zeitpunkt in die Schreibweise der Programmdaten um:
 * "2027-05-07T12:30" in Ortszeit.
 */
export function jetztAlsOrtszeit(zeitpunkt: Date = new Date()): string {
  const f = felder(zeitpunkt);

  return (
    `${f.year}-${zweistellig(f.month!)}-${zweistellig(f.day!)}` +
    `T${zweistellig(f.hour!)}:${zweistellig(f.minute!)}`
  );
}

/**
 * Rechnet eine Ortszeit in einen UTC-Zeitstempel um. Nur fuer den
 * Kalender-Export.
 *
 * Zwei Durchgaenge: Der Zeitzonenversatz haengt vom Zeitpunkt selbst ab (Sommer-
 * oder Winterzeit), den wir erst kennen, wenn wir ihn umgerechnet haben. Der
 * erste Durchgang liefert eine Naeherung, der zweite den richtigen Versatz.
 */
export function ortszeitZuUtc(ortszeit: string): number {
  // Als UTC lesen - das ist absichtlich zunaechst falsch und wird korrigiert.
  const naiv = Date.parse(`${ortszeit}:00Z`);
  let geschaetzt = naiv;

  for (let durchgang = 0; durchgang < 2; durchgang += 1) {
    const f = felder(new Date(geschaetzt));
    const alsUtc = Date.UTC(f.year!, f.month! - 1, f.day!, f.hour!, f.minute!, f.second!);
    geschaetzt = naiv - (alsUtc - geschaetzt);
  }

  return geschaetzt;
}

export interface Zeitlage {
  /** Punkte, die gerade laufen - mehrere bei parallelen Exkursionen. */
  laufend: Programmpunkt[];
  /** Der naechste beginnende Punkt, oder null ausserhalb der Tagung. */
  naechster: Programmpunkt | null;
}

/**
 * Welche Punkte laufen zum Zeitpunkt `jetzt`, und welcher kommt als Naechstes?
 *
 * `jetzt` ist Ortszeit in der Schreibweise der Programmdaten. Ausserhalb des
 * Tagungszeitraums wird nichts markiert: Eine "Jetzt"-Markierung im Februar
 * waere verwirrend, und die Uhr des Geraets kann falsch gehen.
 *
 * Ein Punkt ohne Endzeit gilt nie als laufend - wann er endet, wissen wir nicht.
 */
export function laufendUm(punkte: readonly Programmpunkt[], jetzt: string): Zeitlage {
  const mitZeit = punkte.filter((p) => p.beginn !== undefined);

  if (mitZeit.length === 0) return { laufend: [], naechster: null };

  const erster = mitZeit.reduce((a, b) => (a.beginn! <= b.beginn! ? a : b)).beginn!;
  const letzter = mitZeit.reduce((frueh, p) => {
    const ende = p.ende ?? p.beginn!;
    return ende > frueh ? ende : frueh;
  }, erster);

  // Auf den ganzen Tag ausdehnen, damit der Tagungsbeginn nicht auf die Minute
  // genau getroffen werden muss.
  if (jetzt.slice(0, 10) < erster.slice(0, 10) || jetzt.slice(0, 10) > letzter.slice(0, 10)) {
    return { laufend: [], naechster: null };
  }

  const laufend = mitZeit.filter(
    (p) => p.ende !== undefined && p.beginn! <= jetzt && jetzt < p.ende,
  );

  const kommende = mitZeit
    .filter((p) => p.beginn! > jetzt)
    .sort((a, b) => a.beginn!.localeCompare(b.beginn!));

  return { laufend, naechster: kommende[0] ?? null };
}
