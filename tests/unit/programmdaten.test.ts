import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SPUR_EINLEITUNG } from "../../src/lib/programm.ts";

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

const punkte = inhalt("programm.json") as (Eintrag & { status?: string })[];
const orte = inhalt("orte.json") as { id: string; name: string; adresse?: string; plz?: string }[];
const ortIds = new Set(orte.map((o) => o.id));
const exkursionen = new Map(
  (inhalt("exkursionen.json") as { id: string; titel: string; info?: string }[]).map((e) => [
    e.id,
    e,
  ]),
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

  /** Anschriften der Veranstaltungsorte laut Programmheft 2027 (Abschnitt "Tagungsorte"). */
  it.each([
    ["deseo", "Hindenburgplatz 3", "31134"],
    ["mariano-josephinum", "Domhof 7", "31134"],
    ["knochenhaueramtshaus", "Markt 7", "31134"],
    ["halle39", "Schinkelstraße 7", "31137"],
    ["marktplatz", "Markt 1", "31134"],
    ["dom", "Domhof 3", "31134"],
  ])("Ort %s hat die Anschrift %s, %s Hildesheim", (id, adresse, plz) => {
    const ort = orte.find((o) => o.id === id);
    expect(ort?.adresse).toBe(adresse);
    expect(ort?.plz).toBe(plz);
  });

  /** Die Beschreibung einer Exkursion steht in exkursionen.json (programm.astro). */
  it.each(punkte.filter((p) => p.spur === "exkursion").map((p) => p.id))(
    "Exkursion %s hat eine Beschreibung",
    (id) => {
      expect(exkursionen.get(id)?.info, `${id} fehlt in exkursionen.json`).toBeTruthy();
    },
  );

  /**
   * Programm und Exkursionsseite nennen eine Exkursion gleich - sonst sucht man
   * im Programm einen Titel, der auf der Detailansicht anders lautet.
   */
  it.each(punkte.filter((p) => p.spur === "exkursion").map((p) => [p.id, p.titel] as const))(
    "Exkursion %s heißt in Programm und Beschreibung gleich",
    (id, titel) => {
      expect(exkursionen.get(id)?.titel).toBe(titel);
    },
  );

  /** Titel laut Programmheft 2027: Beide Stadtführungen heißen "Hildesheim entdecken". */
  it.each([
    ["exkursion-stadt", "Stadtführung I: Hildesheim entdecken – Bräuche, Rituale und Traditionen"],
    [
      "exkursion-stadt-2",
      "Stadtführung II: Hildesheim entdecken – Sagenhaftes Fachwerkviertel: Vom Kesselflicker zum Domprobst",
    ],
  ])("Exkursion %s trägt den Titel aus dem Programmheft", (id, titel) => {
    expect(punkte.find((p) => p.id === id)?.titel).toBe(titel);
  });

  /** Entscheidung des Orga-Teams vom 28.11.2026: Alle Punkte gelten als bestätigt. */
  it("führt keinen Programmpunkt als vorläufig", () => {
    const vorlaeufig = punkte.filter((p) => p.status && p.status !== "bestaetigt").map((p) => p.id);

    expect(vorlaeufig).toEqual([]);
  });

  /** Zeiten und Orte laut Programm-Arbeitsfassung vom 25.10.2026 (src/assets/programm/). */
  it.each([
    ["pause-donnerstag", "2027-05-06T17:00", "2027-05-06T19:00", undefined],
    ["ankommen-freitag", "2027-05-07T09:30", "2027-05-07T10:00", "mariano-josephinum"],
    ["ankommen-samstag", "2027-05-08T08:45", "2027-05-08T09:15", "mariano-josephinum"],
    ["studium-generale", "2027-05-08T09:15", "2027-05-08T12:00", "mariano-josephinum"],
    ["mittagsimbiss-samstag", "2027-05-08T12:00", "2027-05-08T13:30", "mariano-josephinum"],
    ["panel-nie-wieder", "2027-05-08T13:30", "2027-05-08T15:00", "mariano-josephinum"],
    ["transfer-dom", "2027-05-08T15:00", "2027-05-08T15:30", undefined],
    ["konzert", "2027-05-08T15:30", "2027-05-08T17:00", "dom"],
    ["ankommen-sonntag", "2027-05-09T10:00", "2027-05-09T10:30", "mariano-josephinum"],
    ["gottesdienst", "2027-05-09T12:15", "2027-05-09T13:15", "dom"],
  ])("%s läuft von %s bis %s", (id, beginn, ende, ortId) => {
    const punkt = punkte.find((p) => p.id === id);

    expect(punkt, `${id} fehlt`).toBeDefined();
    expect([punkt?.beginn, punkt?.ende, punkt?.ortId]).toEqual([beginn, ende, ortId]);
  });

  /** Entscheidung des Orga-Teams vom 28.11.2026: Die Landtagsexkursion findet statt. */
  it("führt elf Exkursionen einschließlich des Landtags", () => {
    const exkursionenIds = punkte.filter((p) => p.spur === "exkursion").map((p) => p.id);

    expect(exkursionenIds).toHaveLength(11);
    expect(exkursionenIds).toContain("exkursion-landtag");
    expect(punkte.find((p) => p.id === "exkursion-landtag")?.titel).not.toMatch(/bestätigt/);
  });

  /** Der Einleitungstext nennt die Zahl in Worten - sie muss zu den Daten passen. */
  it("nennt in der Einleitung die richtige Zahl der Exkursionen", () => {
    expect(SPUR_EINLEITUNG.exkursion).toMatch(/\belf Exkursionen\b/);
  });

  it("verabschiedet ab 13:15 Uhr", () => {
    const punkt = punkte.find((p) => p.id === "verabschiedung");

    expect([punkt?.beginn, punkt?.zeitHinweis]).toEqual(["2027-05-09T13:15", "ab 13:15 Uhr"]);
  });

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
