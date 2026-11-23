/**
 * Rechtlich erforderliche Seiten.
 *
 * Bewusst getrennt von BEREICHE: Das sind keine Kacheln der Startseite, sondern
 * Pflichtangaben, die aus der Fusszeile jeder Seite erreichbar sein muessen.
 * Sie stehen trotzdem als Daten da und nicht als Markup, damit Fusszeile,
 * Vorabspeicher des Service Workers und Tests dieselbe Quelle benutzen - sonst
 * verlinkt die Fusszeile irgendwann auf eine Seite, die es nicht mehr gibt.
 */

export interface RechtlicheSeite {
  /** Adressfragment, z. B. "impressum" fuer /impressum. */
  readonly slug: string;
  readonly titel: string;
}

export const RECHTLICHES: readonly RechtlicheSeite[] = [
  { slug: "impressum", titel: "Impressum" },
  { slug: "datenschutz", titel: "Datenschutzerklärung" },
];
