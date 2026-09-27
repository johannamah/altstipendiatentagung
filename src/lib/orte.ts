/**
 * Orte, Adressen und Weiterleitungen an Karten-Apps.
 *
 * Bewusst ohne Einbindung eines Kartendienstes: Die Weiterleitung ist ein
 * einfacher Verweis, der erst beim Antippen etwas ausloest. Es wird nichts
 * geladen, nichts gesetzt und nichts uebertragen, solange niemand darauf
 * tippt - deshalb braucht es dafuer auch keine Einwilligung.
 */

export type Ortsart = "tagungsort" | "exkursion" | "uebernachtung" | "rahmenprogramm";

export interface Ort {
  id: string;
  name: string;
  adresse?: string;
  plz?: string;
  stadt: string;
  art: Ortsart;
  hinweis?: string;
  koordinaten?: { breite: number; laenge: number };
}

/** Beschriftung je Art - fuer Gruppenueberschriften auf der Ortsseite. */
export const ARTBEZEICHNUNG: Record<Ortsart, string> = {
  tagungsort: "Tagungsort",
  exkursion: "Exkursionsziele",
  uebernachtung: "Unterkünfte",
  rahmenprogramm: "Rahmenprogramm",
};

/** Reihenfolge der Gruppen: erst, wo alle hinmüssen. */
export const ARTREIHENFOLGE: Ortsart[] = [
  "tagungsort",
  "exkursion",
  "rahmenprogramm",
  "uebernachtung",
];

/** "Bahnhofsallee 38, 31134 Hildesheim" - oder nur die Stadt, wenn mehr fehlt. */
export function vollstaendigeAdresse(ort: Ort): string {
  const ortszeile = [ort.plz, ort.stadt].filter(Boolean).join(" ");
  return [ort.adresse, ortszeile].filter(Boolean).join(", ");
}

/**
 * Suchbegriff fuer die Karten-App: Name UND Adresse.
 *
 * Der Name allein ist mehrdeutig ("Novotel" gibt es oft), die Adresse allein
 * verliert die Information, worum es geht. Zusammen findet jede Karten-App
 * den richtigen Punkt.
 */
function suchbegriff(ort: Ort): string {
  return [ort.name, vollstaendigeAdresse(ort)].filter(Boolean).join(", ");
}

/**
 * Nur Orte mit Adresse bekommen eine Weiterleitung. Ein Verweis auf
 * "Bosch Hildesheim" ohne Strasse fuehrt in einer Karten-App irgendwohin -
 * und irgendwohin ist schlimmer als nirgendwohin (Produktprinzip 1).
 */
export function hatKartenverweis(ort: Ort): boolean {
  return ort.adresse !== undefined || ort.koordinaten !== undefined;
}

/**
 * Koordinaten gewinnen, wenn vorhanden: Sie sind eindeutig, eine Adresse
 * muss erst gedeutet werden.
 */
function ziel(ort: Ort): string {
  return ort.koordinaten ? `${ort.koordinaten.breite},${ort.koordinaten.laenge}` : suchbegriff(ort);
}

/** Dokumentiertes URL-Muster von Google Maps; oeffnet auf Android die App. */
export function googleMapsVerweis(ort: Ort): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ziel(ort))}`;
}

/** Dokumentiertes URL-Muster von Apple Karten; oeffnet auf iOS die App. */
export function appleKartenVerweis(ort: Ort): string {
  const felder = new URLSearchParams({ q: ort.name });

  if (ort.koordinaten) {
    felder.set("ll", `${ort.koordinaten.breite},${ort.koordinaten.laenge}`);
  } else {
    felder.set("address", vollstaendigeAdresse(ort));
  }

  return `https://maps.apple.com/?${felder.toString()}`;
}

/* ===== Uebersichtskarte =====

   Bewusst selbst gezeichnet statt ein Kartendienst eingebettet: Eine
   eingebettete Karte laedt fremde Inhalte und uebertraegt die IP-Adresse der
   Betrachtenden, bevor jemand zugestimmt hat - damit braeuchte die Seite ein
   Einwilligungsbanner, und das waere die erste Nachverfolgung ueberhaupt auf
   diesem Angebot.

   Eine eigene Karte hat ausserdem zwei praktische Vorteile: Sie funktioniert
   ohne Netz (Annahme A5 - schlechtes WLAN in der Tagungsstaette) und sie
   passt zur uebrigen Gestaltung.

   Sie zeigt die LAGE ZUEINANDER, keine Strassen. Wer hin will, tippt auf die
   Weiterleitung - dort ist die Karten-App ohnehin ueberlegen. */

export interface Kartenpunkt {
  ort: Ort;
  /** Position im Koordinatensystem der Zeichnung, 0..100. */
  x: number;
  y: number;
}

/**
 * Rechnet geografische Koordinaten in Zeichenpositionen um.
 *
 * Die Laengengrade werden mit dem Kosinus der Breite gestaucht: Auf 52 Grad
 * Nord ist ein Grad Laenge nur noch rund 62 Prozent so lang wie ein Grad
 * Breite. Ohne diese Korrektur waere die Karte spuerbar in die Breite gezogen.
 */
export function alsKartenpunkte(orte: readonly Ort[], rand = 8): Kartenpunkt[] {
  const mitKoordinaten = orte.filter(
    (ort): ort is Ort & { koordinaten: NonNullable<Ort["koordinaten"]> } =>
      ort.koordinaten !== undefined,
  );

  if (mitKoordinaten.length === 0) return [];

  const breiten = mitKoordinaten.map((ort) => ort.koordinaten.breite);
  const mittlereBreite = (Math.min(...breiten) + Math.max(...breiten)) / 2;
  const stauchung = Math.cos((mittlereBreite * Math.PI) / 180);

  const punkte = mitKoordinaten.map((ort) => ({
    ort,
    roh: { x: ort.koordinaten.laenge * stauchung, y: -ort.koordinaten.breite },
  }));

  const xs = punkte.map((p) => p.roh.x);
  const ys = punkte.map((p) => p.roh.y);
  const spanneX = Math.max(...xs) - Math.min(...xs);
  const spanneY = Math.max(...ys) - Math.min(...ys);
  // Gleiche Skala fuer beide Achsen, sonst verzerrt die Karte.
  const spanne = Math.max(spanneX, spanneY) || 1;
  const nutzbar = 100 - 2 * rand;

  return punkte.map(({ ort, roh }) => ({
    ort,
    // Zentriert, damit ein schmales Feld nicht an den Rand klebt.
    x:
      rand +
      (roh.x - Math.min(...xs)) * (nutzbar / spanne) +
      (nutzbar - spanneX * (nutzbar / spanne)) / 2,
    y:
      rand +
      (roh.y - Math.min(...ys)) * (nutzbar / spanne) +
      (nutzbar - spanneY * (nutzbar / spanne)) / 2,
  }));
}
