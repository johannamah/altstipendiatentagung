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
  /*
   * Die Datenschutzerklaerung fehlt hier bewusst. Sie ist erst zu erstellen,
   * wenn feststeht, wer betreibt und was verarbeitet wird (F2, F4) - ein
   * erfundener Text waere schlimmer als keiner. Solange die Anwendung keine
   * personenbezogenen Daten verarbeitet und hinter der Zugangsabfrage steht
   * (ADR-0010), ist das vertretbar; vor der Veroeffentlichung nicht mehr.
   */
];
