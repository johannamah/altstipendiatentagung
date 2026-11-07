/**
 * Was gehoert gerade auf die Startseite?
 *
 * Reine Rechnung ueber die Programmzeiten, ohne DOM-Bezug - der Zeitpunkt wird
 * uebergeben und nicht aus `Date.now()` gelesen, sonst waere nichts davon
 * reproduzierbar pruefbar.
 *
 * Zeiten sind durchgaengig lokale Zeit in Europe/Berlin als Zeichenkette
 * "JJJJ-MM-TTTHH:MM", wie im uebrigen Programm auch.
 */

import type { Programmpunkt } from "./programm.ts";
import { laufendUm } from "./zeit.ts";

export type Lageart =
  /** Die Tagung hat noch nicht begonnen. */
  | "vorher"
  /** Mindestens ein Punkt laeuft gerade. */
  | "jetzt"
  /** Gerade laeuft nichts, der naechste Punkt steht an. */
  | "gleich"
  /** Die Tagung ist vorbei. */
  | "vorbei";

export interface Lage {
  art: Lageart;
  /** Mehrere bei gleichzeitigen Punkten - am Freitag sind es sieben. */
  punkte: Programmpunkt[];
}

/**
 * Welche Punkte gehoeren zum Zeitpunkt `jetzt` auf die Karte?
 *
 * Vor der Tagung ist das der erste Programmpunkt: Die Karte soll auch im
 * Februar etwas zeigen, und der Auftakt ist das Naechstliegende.
 *
 * Nach der Tagung steht dort, dass sie vorbei ist. Einen vergangenen Termin zu
 * zeigen waere irrefuehrend - und wer die App im Juni oeffnet, sucht nicht nach
 * dem Freitagvormittag (Produktprinzip 1).
 */
export function naechsteLage(punkte: readonly Programmpunkt[], jetzt: string): Lage {
  const mitZeit = [...punkte]
    .filter((punkt) => punkt.beginn !== undefined)
    .sort((a, b) => a.beginn!.localeCompare(b.beginn!) || a.titel.localeCompare(b.titel, "de"));

  if (mitZeit.length === 0) return { art: "vorbei", punkte: [] };

  const erster = mitZeit[0]!;
  if (jetzt < erster.beginn!) {
    // Alle Punkte, die zugleich mit dem ersten beginnen.
    const gleichzeitig = mitZeit.filter((punkt) => punkt.beginn === erster.beginn);
    return { art: "vorher", punkte: gleichzeitig };
  }

  const { laufend, naechster } = laufendUm(mitZeit, jetzt);

  if (laufend.length > 0) return { art: "jetzt", punkte: laufend };

  if (naechster) {
    const gleichzeitig = mitZeit.filter((punkt) => punkt.beginn === naechster.beginn);
    return { art: "gleich", punkte: gleichzeitig };
  }

  return { art: "vorbei", punkte: [] };
}

/** Minuten zwischen zwei Ortszeiten. */
function minutenBis(jetzt: string, ziel: string): number {
  const alsZahl = (zeitpunkt: string) => Date.parse(`${zeitpunkt}:00Z`);
  return Math.round((alsZahl(ziel) - alsZahl(jetzt)) / 60_000);
}

/**
 * "in 18 Min.", "in 3 Std.", "am Freitag" - oder null, wenn der Zeitpunkt
 * schon vorbei ist.
 *
 * Stunden werden ABGERUNDET: "in 2 Std." bei zwei Stunden fuenfzig ist die
 * vorsichtigere Angabe. Wer zu frueh losgeht, kommt an.
 */
export function formatiereVorlauf(jetzt: string, beginn: string): string | null {
  const minuten = minutenBis(jetzt, beginn);

  if (minuten <= 0) return null;
  if (minuten < 60) return `in ${minuten} Min.`;
  if (jetzt.slice(0, 10) === beginn.slice(0, 10)) return `in ${Math.floor(minuten / 60)} Std.`;

  const [jahr, monat, tag] = beginn.slice(0, 10).split("-").map(Number) as [number, number, number];
  const wochentag = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(jahr, monat - 1, tag)));

  return `am ${wochentag}`;
}

/**
 * "5. Mai, 09:32 Uhr" - der Stand, auf dem die angezeigten Inhalte beruhen.
 *
 * Ueber UTC gerechnet, damit das Datum nicht von der Zeitzone des Rechners
 * abhaengt: Der Bau laeuft in der CI unter UTC.
 */
export function formatiereStand(zeitpunkt: string): string {
  const [jahr, monat, tag] = zeitpunkt.slice(0, 10).split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const datum = new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(jahr, monat - 1, tag)));

  return `${datum}, ${zeitpunkt.slice(11, 16)} Uhr`;
}
