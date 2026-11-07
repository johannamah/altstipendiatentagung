/**
 * Die Bereiche der Startseite.
 *
 * Bewusst getrennt von der Darstellung (ADR-0006): Wer einen Bereich umbenennt
 * oder umsortiert, aendert Daten und kein Markup. Die Reihenfolge hier ist die
 * Reihenfolge auf der Startseite.
 *
 * Uebernommen aus dem Einzeldatei-Entwurf. Die Reihenfolge folgt den
 * Nutzungsphasen aus docs/vision.md: zuerst, was sich kurzfristig aendert
 * (Ankuendigungen), dann Programm und Anmeldung, danach das Uebrige.
 *
 * `farbe` verweist auf die Kacheltokens in src/styles/tokens.css; `ikone` auf ein
 * <symbol> in src/components/IkonenSammlung.astro. Beides wird in
 * tests/unit/bereiche.test.ts geprueft.
 */

export type Kachelfarbe =
  | "blau"
  | "pink"
  | "gruen"
  | "teal"
  | "lila"
  | "rot"
  | "braun"
  | "gold"
  | "orange"
  | "schiefer"
  | "bordeaux";

export interface Bereich {
  /** Adressfragment, z. B. "programm" fuer /programm. */
  readonly slug: string;
  readonly titel: string;
  /** Eine Zeile, die erklaert, was dahinter liegt. */
  readonly unterzeile: string;
  /** Name eines <symbol> ohne das Praefix "i-". */
  readonly ikone: string;
  readonly farbe: Kachelfarbe;
  /**
   * Externe Adresse, falls die Kachel die App verlaesst (z. B. das
   * Anmeldeformular, ADR-0011). Dann gibt es keine eigene Seite, und die
   * Kachel oeffnet einen neuen Tab - die Unterzeile muss das ankuendigen.
   */
  readonly extern?: string;
}

export const BEREICHE: readonly Bereich[] = [
  {
    slug: "ankuendigungen",
    titel: "Ankündigungen",
    unterzeile: "Kurzfristige News & Änderungen",
    ikone: "megaphone",
    farbe: "rot",
  },
  {
    slug: "begruessung",
    titel: "Begrüßungsworte",
    unterzeile: "Grußwort zur Tagung",
    ikone: "message",
    farbe: "gruen",
  },
  {
    slug: "programm",
    titel: "Programm",
    unterzeile: "Alle Programmpunkte im Überblick",
    ikone: "clipboard",
    farbe: "blau",
  },
  {
    slug: "referenten",
    titel: "Referenten & Gäste",
    unterzeile: "Wer auf der Tagung spricht",
    ikone: "mic",
    farbe: "bordeaux",
  },
  {
    slug: "anmeldung",
    titel: "Anmeldung",
    unterzeile: "Zum Anmeldeformular (öffnet neuen Tab)",
    ikone: "edit",
    farbe: "pink",
    extern: "https://forms.cloud.microsoft/e/yyrAWFASLc",
  },
  {
    slug: "unterbringung",
    titel: "Unterbringung",
    unterzeile: "Hotelkontingente & Buchung",
    ikone: "bed",
    farbe: "lila",
  },
  {
    slug: "fotos",
    titel: "Fotos",
    unterzeile: "Hochladen & ansehen",
    ikone: "camera",
    farbe: "gold",
  },
  {
    slug: "hildesheim",
    titel: "Hildesheim",
    unterzeile: "Geschichte, Sehenswürdigkeiten & Tipps",
    ikone: "landmark",
    farbe: "orange",
  },
  {
    slug: "faq",
    titel: "FAQ",
    unterzeile: "Häufige Fragen",
    ikone: "help",
    farbe: "braun",
  },
  {
    slug: "orte",
    titel: "Orte & Anfahrt",
    unterzeile: "Übersichtskarte & Wegbeschreibungen",
    ikone: "pin",
    farbe: "schiefer",
  },
  {
    slug: "kontakt",
    titel: "Kontakt & Orga-Team",
    unterzeile: "Ansprechpersonen & Fragen",
    ikone: "mail",
    farbe: "teal",
  },
];

/** Kacheln mit eigener Seite in der App - nur diese werden gebaut und vorab gespeichert. */
export const SEITENBEREICHE: readonly Bereich[] = BEREICHE.filter(
  (bereich) => bereich.extern === undefined,
);

/** Wohin die Kachel fuehrt: die externe Adresse oder die eigene Seite. */
export function kachelZiel(bereich: Bereich): string {
  return bereich.extern ?? `/${bereich.slug}`;
}
