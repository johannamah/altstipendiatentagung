/**
 * Logik rund um das Programm: gruppieren, sortieren, darstellen.
 *
 * Bewusst ohne DOM-Bezug und ohne Astro-Import, damit sie ohne Browser testbar
 * bleibt (AGENTS.md: Geschaeftsregeln testbar und unabhaengig von UI-Details).
 *
 * Zeiten sind durchgaengig LOKALE Zeit in Europe/Berlin, als Zeichenkette
 * "JJJJ-MM-TTTHH:MM". Dadurch braucht die Darstellung keine Zeitzonenrechnung:
 * Ein Vortrag um 13:00 Uhr heisst 13:00 Uhr, unabhaengig davon, wo der Build
 * gelaufen ist. Erst der Kalender-Export muss die Zeitzone ausweisen.
 */

export type Spur = "haupt" | "exkursion" | "studium-generale" | "rahmen";
export type Bestaetigung = "bestaetigt" | "vorlaeufig" | "platzhalter";

export interface Programmpunkt {
  id: string;
  titel: string;
  beginn?: string;
  ende?: string;
  zeitHinweis?: string;
  ort?: string;
  adresse?: string;
  beschreibung?: string;
  spur: Spur;
  status: Bestaetigung;
  optional: boolean;
  hinweis?: string;
  personen: ReadonlyArray<{ name: string; rolle?: string }>;
}

export interface Tag {
  /** "2027-05-06" */
  datum: string;
  punkte: Programmpunkt[];
}

/**
 * Der Tag, an dem ein Punkt im Programm steht - immer der Tag des BEGINNS.
 * Der Festabend am Samstag endet um 03:00 Uhr und gehoert trotzdem zum Samstag.
 */
export function tagesSchluessel(punkt: Programmpunkt): string | null {
  return punkt.beginn ? punkt.beginn.slice(0, 10) : null;
}

/**
 * Gruppiert nach Tagen und sortiert innerhalb eines Tages nach Beginn.
 * Punkte ohne Zeit werden nicht verworfen, sondern getrennt zurueckgegeben -
 * sie gehoeren ins Programm, nur eben ohne Termin.
 */
export function nachTagenGruppieren(punkte: readonly Programmpunkt[]): {
  tage: Tag[];
  ohneZeit: Programmpunkt[];
} {
  const nachDatum = new Map<string, Programmpunkt[]>();
  const ohneZeit: Programmpunkt[] = [];

  for (const punkt of punkte) {
    const datum = tagesSchluessel(punkt);

    if (datum === null) {
      ohneZeit.push(punkt);
      continue;
    }

    const vorhandene = nachDatum.get(datum);
    if (vorhandene) vorhandene.push(punkt);
    else nachDatum.set(datum, [punkt]);
  }

  const tage = [...nachDatum.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([datum, eintraege]) => ({
      datum,
      // Bei gleichem Beginn nach Titel: sonst haengt die Reihenfolge der
      // Exkursionen von der Reihenfolge in der Datei ab und springt bei jeder
      // Pflege - das faellt im Diff nicht auf, den Nutzenden aber schon.
      punkte: eintraege.sort(
        (a, b) => a.beginn!.localeCompare(b.beginn!) || a.titel.localeCompare(b.titel, "de"),
      ),
    }));

  return { tage, ohneZeit };
}

/**
 * "Donnerstag, 6. Mai 2027".
 *
 * Rechnet ueber UTC, damit das Datum nicht von der Zeitzone des bauenden
 * Rechners abhaengt: Die CI laeuft unter UTC, die Entwicklung unter
 * Europe/Berlin - ohne diese Festlegung waere das Datum dort um einen Tag
 * verschoben.
 */
export function formatiereDatum(datum: string): string {
  const [jahr, monat, tag] = datum.split("-").map(Number) as [number, number, number];
  const zeitpunkt = new Date(Date.UTC(jahr, monat - 1, tag));

  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(zeitpunkt);
}

/** "13:00" aus "2027-05-06T13:00". */
function uhrzeit(zeitpunkt: string): string {
  return zeitpunkt.slice(11, 16);
}

/**
 * "13:00–13:30 Uhr", "ab 21:00 Uhr", "19:00–03:00 Uhr (am Folgetag)".
 *
 * Ein ausdruecklicher Zeithinweis gewinnt: Wo das Programm "ab 19:00 Uhr" sagt,
 * soll nicht eine erfundene Endzeit erscheinen (Produktprinzip 1).
 */
export function formatiereZeitraum(punkt: Programmpunkt): string {
  if (punkt.zeitHinweis) return punkt.zeitHinweis;
  if (!punkt.beginn) return "Zeit noch offen";
  if (!punkt.ende) return `ab ${uhrzeit(punkt.beginn)} Uhr`;

  const ueberMitternacht = punkt.ende.slice(0, 10) !== punkt.beginn.slice(0, 10);
  const zeitraum = `${uhrzeit(punkt.beginn)}–${uhrzeit(punkt.ende)} Uhr`;

  return ueberMitternacht ? `${zeitraum} (am Folgetag)` : zeitraum;
}

/** Kurzform fuer die Tagesauswahl: "Do, 6.5." */
export function formatiereTagKurz(datum: string): string {
  const [jahr, monat, tag] = datum.split("-").map(Number) as [number, number, number];
  const zeitpunkt = new Date(Date.UTC(jahr, monat - 1, tag));
  const wochentag = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    timeZone: "UTC",
  }).format(zeitpunkt);

  return `${wochentag}, ${tag}.${monat}.`;
}

/** Klartext fuer den Bestaetigungsgrad - nie allein ueber Farbe (Regel 19). */
export const STATUS_TEXT: Record<Bestaetigung, string | null> = {
  bestaetigt: null,
  vorlaeufig: "noch nicht bestätigt",
  platzhalter: "Platzhalter",
};

/** Ueberschrift fuer eine Gruppe gleichzeitiger Punkte derselben Spur. */
export const SPUR_TEXT: Record<Spur, string | null> = {
  haupt: null,
  exkursion: "Exkursionen",
  "studium-generale": "Parallele Vorträge",
  rahmen: null,
};
