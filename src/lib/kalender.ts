/**
 * Kalender-Export nach RFC 5545 (iCalendar).
 *
 * Bewusst ohne Bibliothek: Der Umfang ist klein, und die Stellen, an denen es
 * schiefgeht - Maskierung, Zeilenfaltung, Zeitzone -, sind hier sichtbar und
 * einzeln getestet, statt in einer Abhaengigkeit zu verschwinden.
 */

import type { Programmpunkt } from "./programm.ts";
import { vollstaendigeAdresse, type Ort } from "./orte.ts";
import { ortszeitZuUtc } from "./zeit.ts";

/** Namensraum fuer die UIDs. Muss stabil bleiben, sonst entstehen Doppeleintraege. */
const NAMENSRAUM = "jahrestagung-2027.asev.de";

/**
 * Nur Punkte mit Beginn UND Ende lassen sich als Termin exportieren.
 * Ein Punkt "ab 21:00 Uhr" bekaeme sonst eine erfundene Dauer.
 */
export function istExportierbar(punkt: Programmpunkt): boolean {
  return punkt.beginn !== undefined && punkt.ende !== undefined;
}

/**
 * Maskiert Sonderzeichen in TEXT-Werten.
 *
 * Komma und Semikolon trennen in iCalendar Felder: Unmaskiert zerreisst ein
 * Titel wie "Glaube, Werte, Europa" den Eintrag. Der Backslash muss zuerst
 * ersetzt werden, sonst maskiert man die eigenen Maskierungen doppelt.
 */
function maskiere(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "20270507T103000Z" aus einer Ortszeit. */
function alsUtcStempel(ortszeit: string): string {
  const zeitpunkt = new Date(ortszeitZuUtc(ortszeit));
  const zz = (wert: number) => String(wert).padStart(2, "0");

  return (
    `${zeitpunkt.getUTCFullYear()}${zz(zeitpunkt.getUTCMonth() + 1)}${zz(zeitpunkt.getUTCDate())}` +
    `T${zz(zeitpunkt.getUTCHours())}${zz(zeitpunkt.getUTCMinutes())}${zz(zeitpunkt.getUTCSeconds())}Z`
  );
}

/**
 * Faltet Zeilen auf hoechstens 75 Oktette, Fortsetzung mit fuehrendem
 * Leerzeichen (RFC 5545, Abschnitt 3.1).
 *
 * Gezaehlt werden Oktette, nicht Zeichen: Ein "ü" belegt zwei. Deshalb wird
 * zeichenweise gemessen und nie mitten in einem Zeichen getrennt - sonst
 * entstuende ungueltiges UTF-8.
 *
 * TextEncoder statt Buffer: Dieses Modul laeuft auch im Browser, und Buffer
 * gibt es dort nicht.
 */
const OKTETTE = new TextEncoder();
const laengeInOktetten = (text: string) => OKTETTE.encode(text).length;

function falte(zeile: string): string[] {
  const teile: string[] = [];
  let aktuell = "";
  let grenze = 75;

  for (const zeichen of zeile) {
    const laenge = laengeInOktetten(zeichen);

    if (laengeInOktetten(aktuell) + laenge > grenze) {
      teile.push(aktuell);
      aktuell = " ";
      grenze = 75;
    }

    aktuell += zeichen;
  }

  if (aktuell.length > 0) teile.push(aktuell);

  return teile;
}

/**
 * Erzeugt einen vollstaendigen Kalender aus den exportierbaren Punkten.
 *
 * `orte` wird gebraucht, seit die Programmdaten nur noch die Kennung eines
 * Ortes tragen. Fehlt die Sammlung, entsteht ein Eintrag ohne Ortsangabe -
 * das ist unschoen, aber besser als ein Eintrag mit falschem Ort.
 */
export function alsKalender(
  punkte: readonly Programmpunkt[],
  orte?: ReadonlyMap<string, Ort>,
): string {
  const zeilen: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//ASeV//Jahrestagung 2027//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const punkt of punkte) {
    if (!istExportierbar(punkt)) continue;

    const ortsdaten = punkt.ortId ? orte?.get(punkt.ortId) : undefined;
    const ort = ortsdaten
      ? [ortsdaten.name, vollstaendigeAdresse(ortsdaten)].filter(Boolean).join(", ")
      : "";
    const beschreibung = [punkt.beschreibung, punkt.hinweis].filter(Boolean).join(" ");

    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${punkt.id}@${NAMENSRAUM}`,
      // DTSTAMP muss vorhanden sein. Feste Zeit statt "jetzt", damit zwei
      // Exporte derselben Auswahl Byte fuer Byte gleich sind - sonst sieht
      // jeder Kalender bei jedem Export eine Aenderung.
      `DTSTAMP:${alsUtcStempel(punkt.beginn!)}`,
      `DTSTART:${alsUtcStempel(punkt.beginn!)}`,
      `DTEND:${alsUtcStempel(punkt.ende!)}`,
      `SUMMARY:${maskiere(punkt.titel)}`,
      // Unbestaetigte Punkte als vorlaeufig kennzeichnen - dann steht im
      // Kalender, was im Programm steht.
      `STATUS:${punkt.status === "bestaetigt" ? "CONFIRMED" : "TENTATIVE"}`,
    );

    if (ort) zeilen.push(`LOCATION:${maskiere(ort)}`);
    if (beschreibung) zeilen.push(`DESCRIPTION:${maskiere(beschreibung)}`);

    zeilen.push("END:VEVENT");
  }

  zeilen.push("END:VCALENDAR");

  // Abschliessendes CRLF: RFC 5545 verlangt, dass auch die letzte Zeile
  // ordentlich beendet wird. Manche Kalender sind da streng.
  return `${zeilen.flatMap(falte).join("\r\n")}\r\n`;
}

/** Dateiname fuer den Download. */
export function dateiname(punkte: readonly Programmpunkt[]): string {
  return punkte.length === 1
    ? `jahrestagung-2027-${punkte[0]!.id}.ics`
    : "jahrestagung-2027-mein-programm.ics";
}
