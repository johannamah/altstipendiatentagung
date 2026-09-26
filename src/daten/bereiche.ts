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
  "blau" | "pink" | "gruen" | "teal" | "lila" | "rot" | "braun" | "gold" | "orange";

export interface Bereich {
  /** Adressfragment, z. B. "programm" fuer /programm. */
  readonly slug: string;
  readonly titel: string;
  /** Eine Zeile, die erklaert, was dahinter liegt. */
  readonly unterzeile: string;
  /** Name eines <symbol> ohne das Praefix "i-". */
  readonly ikone: string;
  readonly farbe: Kachelfarbe;
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
    slug: "anmeldung",
    titel: "Anmeldung",
    unterzeile: "Zur Tagung & Exkursion anmelden",
    ikone: "edit",
    farbe: "pink",
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
    titel: "Hildesheim & Umgebung",
    unterzeile: "Sightseeing, Essen & Geschichte",
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
    slug: "kontakt",
    titel: "Kontakt & Orga-Team",
    unterzeile: "Ansprechpersonen & Fragen",
    ikone: "mail",
    farbe: "teal",
  },
];
