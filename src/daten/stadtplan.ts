/**
 * Was der illustrierte Stadtplan (src/assets/orte/stadtplan-hildesheim.png)
 * zeigt, als Text.
 *
 * Die Liste ist die Textalternative zum Bild (WCAG 1.1.1): Die Gehzeiten
 * stehen sonst nur in der Grafik, und deren Beschriftungen sind auf dem
 * Smartphone ohne Vergroessern kaum lesbar. Wer den Plan austauscht, gleicht
 * diese Liste mit ab. Name und Adresse kommen aus src/content/orte.json, damit
 * sie mit der Ortsliste darunter uebereinstimmen.
 */

/** Von hier gehen alle Wege im Plan aus. */
export const AUSGANGSORT_ID = "mariano-josephinum";

export interface WegImStadtplan {
  /** Kennung aus src/content/orte.json. */
  readonly ortId: string;
  /** Was der Plan an diesem Ort zusaetzlich nennt, etwa die Veranstaltung. */
  readonly zusatz?: string;
  /** Wie man laut Plan vom Ausgangsort hinkommt. */
  readonly weg: string;
}

/** Nach Entfernung geordnet, mit den Angaben aus dem Plan. */
export const WEGE_IM_STADTPLAN: readonly WegImStadtplan[] = [
  { ortId: "dom", weg: "ca. 3 Min. zu Fuß" },
  { ortId: "deseo", weg: "ca. 4–5 Min. zu Fuß" },
  { ortId: "marktplatz", zusatz: "Weinfest", weg: "ca. 6 Min. zu Fuß" },
  { ortId: "knochenhaueramtshaus", weg: "ca. 6 Min. zu Fuß" },
  { ortId: "van-der-valk", weg: "ca. 6–7 Min. zu Fuß" },
  { ortId: "buergermeisterkapelle", weg: "ca. 7 Min. zu Fuß" },
  { ortId: "hey-lou", weg: "ca. 10–11 Min. zu Fuß" },
  { ortId: "bb-hotel", weg: "ca. 15–16 Min. zu Fuß" },
  { ortId: "schlafladen", weg: "ca. 22–23 Min. zu Fuß" },
  { ortId: "halle39", weg: "Transfer ab dem Transferpunkt am Mariano-Josephinum" },
];
