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

const inhalt = (datei: string) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../../src/content/${datei}`, import.meta.url)), "utf8"),
  );

interface Eintrag {
  id: string;
  titel: string;
  beginn?: string;
  ende?: string;
  zeitHinweis?: string;
  ortId?: string;
  spur?: string;
  personen?: { name: string; rolle?: string }[];
}

const punkte = inhalt("programm.json") as Eintrag[];
const ortIds = new Set((inhalt("orte.json") as { id: string }[]).map((o) => o.id));
const exkursionen = new Map(
  (inhalt("exkursionen.json") as { id: string; info?: string }[]).map((e) => [e.id, e]),
);

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

  it.each(punkte.filter((p) => p.ortId).map((p) => [p.id, p.ortId] as const))(
    "%s verweist auf einen gepflegten Ort",
    (_id, ortId) => {
      expect(ortIds.has(ortId!), `${ortId} fehlt in orte.json`).toBe(true);
    },
  );

  /** Die Beschreibung einer Exkursion steht in exkursionen.json (programm.astro). */
  it.each(punkte.filter((p) => p.spur === "exkursion").map((p) => p.id))(
    "Exkursion %s hat eine Beschreibung",
    (id) => {
      expect(exkursionen.get(id)?.info, `${id} fehlt in exkursionen.json`).toBeTruthy();
    },
  );

  /**
   * Das Repository ist oeffentlich, und was hier steht, ist mit dem Commit
   * veroeffentlicht. Die Namen aus dem Programmheft 2027 sind freigegeben -
   * ausser denen mit Vorbehalt ("unverbindlich zugesagt", "angefragt") und den
   * Platzhaltern fuer noch offene Gaeste. Die duerfen nie als Person erscheinen.
   */
  it("veroeffentlichen keine Person mit Vorbehalt und keinen Platzhalter als Namen", () => {
    const vorbehalt = /angefragt|unverbindlich|zugesagt|\[|\]|podiumsgast/i;
    const betroffen = punkte.flatMap((p) =>
      (p.personen ?? [])
        .filter((person) => vorbehalt.test(`${person.name} ${person.rolle ?? ""}`))
        .map((person) => `${p.id}: ${person.name}`),
    );

    expect(betroffen).toEqual([]);
  });
});
