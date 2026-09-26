import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Prueft den Datenbestand selbst, nicht die Logik.
 *
 * Das Schema in src/content.config.ts faengt Formfehler ab. Was es NICHT sieht,
 * sind inhaltlich unsinnige, aber formal gueltige Werte - genau davon gab es in
 * der Vorlage welche: Die zwoelf Slots des Studium Generale trugen die Jahre
 * 2031 bis 2042 statt 2027. Jede dieser Zeilen war ein gueltiges Datum.
 */

const DATEI = fileURLToPath(new URL("../../src/content/programm.json", import.meta.url));

interface Eintrag {
  id: string;
  titel: string;
  beginn?: string;
  ende?: string;
  zeitHinweis?: string;
  personen?: unknown[];
}

const punkte = JSON.parse(readFileSync(DATEI, "utf8")) as Eintrag[];

/** Die Tagung laeuft vom 5. bis 9. Mai 2027. Der Festabend endet am 9. um 03:00 Uhr. */
const ERSTER_TAG = "2027-05-05";
const LETZTER_TAG = "2027-05-09";

describe("Programmdaten", () => {
  it("enthalten Punkte", () => {
    expect(punkte.length).toBeGreaterThan(0);
  });

  it("haben eindeutige Kennungen", () => {
    const ids = punkte.map((p) => p.id);
    const doppelte = ids.filter((id, i) => ids.indexOf(id) !== i);

    expect(doppelte, `doppelte Kennungen: ${doppelte.join(", ")}`).toEqual([]);
  });

  /**
   * Die Kennung wird in "Mein Programm" gespeichert und landet in
   * Kalendereintraegen. Ein Leerzeichen oder Umlaut darin faellt erst auf,
   * wenn jemandes gespeicherte Auswahl nicht mehr passt.
   */
  it.each(punkte.map((p) => p.id))(
    "Kennung %s ist klein geschrieben und ohne Sonderzeichen",
    (id) => {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    },
  );

  it.each(punkte.map((p) => [p.id, p] as const))("%s liegt im Tagungszeitraum", (_id, punkt) => {
    for (const zeitpunkt of [punkt.beginn, punkt.ende]) {
      if (zeitpunkt === undefined) continue;

      const tag = zeitpunkt.slice(0, 10);
      expect(tag >= ERSTER_TAG, `${zeitpunkt} liegt vor dem ${ERSTER_TAG}`).toBe(true);
      expect(tag <= LETZTER_TAG, `${zeitpunkt} liegt nach dem ${LETZTER_TAG}`).toBe(true);
    }
  });

  it.each(punkte.map((p) => [p.id, p] as const))("%s endet nach seinem Beginn", (_id, punkt) => {
    if (punkt.beginn === undefined || punkt.ende === undefined) return;
    expect(punkt.ende > punkt.beginn).toBe(true);
  });

  it.each(punkte.map((p) => [p.id, p] as const))("%s hat eine Zeitangabe", (_id, punkt) => {
    expect(punkt.beginn !== undefined || punkt.zeitHinweis !== undefined).toBe(true);
  });

  /**
   * Das Repository ist oeffentlich. Solange nicht geklaert ist, welche Namen
   * freigegeben sind (docs/offene-fragen.md), gehoert keiner in den Datenbestand -
   * die Vorlage fuehrt Referierende teils mit Vermerken wie "angefragt".
   *
   * Dieser Test wird entfernt, sobald die Freigabe vorliegt. Bis dahin verhindert
   * er, dass ein Name versehentlich veroeffentlicht wird.
   */
  it("enthalten noch keine Personennamen", () => {
    const mitPersonen = punkte.filter((p) => (p.personen?.length ?? 0) > 0).map((p) => p.id);

    expect(
      mitPersonen,
      `Personennamen brauchen erst die Freigabe des Orga-Teams: ${mitPersonen.join(", ")}`,
    ).toEqual([]);
  });
});
