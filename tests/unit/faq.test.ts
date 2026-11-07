import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Die Anleitung zum Startbildschirm ist der einzige Weg, auf dem Nutzende von
 * der Installierbarkeit erfahren: iOS zeigt von sich aus KEINEN Hinweis darauf,
 * dass eine Seite sich wie eine App ablegen laesst (ADR-0002). Ohne diese
 * Anleitung bleibt die PWA fuer die Zielgruppe eine gewoehnliche Website - und
 * das faellt beim Durchklicken niemandem auf, weil technisch alles stimmt.
 */

interface Eintrag {
  id: string;
  frage: string;
  antwort: string;
  schritte?: readonly string[];
  hinweis?: string;
}

const eintraege: readonly Eintrag[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../src/content/faq.json", import.meta.url)), "utf8"),
);

const finde = (id: string): Eintrag | undefined => eintraege.find((e) => e.id === id);

const ANLEITUNGEN = ["startbildschirm-ios", "startbildschirm-android"] as const;

describe("FAQ-Daten", () => {
  it("haben eindeutige Kennungen", () => {
    const ids = eintraege.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("haben durchgaengig Frage und Antwort", () => {
    for (const eintrag of eintraege) {
      expect(eintrag.frage.trim().length, `Frage fehlt bei ${eintrag.id}`).toBeGreaterThan(0);
      expect(eintrag.antwort.trim().length, `Antwort fehlt bei ${eintrag.id}`).toBeGreaterThan(0);
    }
  });
});

describe("Anleitung zum Startbildschirm", () => {
  it.each(ANLEITUNGEN)("%s ist vorhanden und in Schritten gegliedert", (id) => {
    const eintrag = finde(id);

    expect(eintrag, `FAQ-Eintrag ${id} fehlt`).toBeDefined();
    // Eine Anleitung als Fliesstext waere am Geraet nicht abarbeitbar: Man
    // verliert die Stelle, sobald man den Blick hebt.
    expect(eintrag!.schritte?.length ?? 0, `${id} hat keine Schritte`).toBeGreaterThanOrEqual(3);

    for (const [nummer, schritt] of (eintrag!.schritte ?? []).entries()) {
      expect(schritt.trim().length, `Schritt ${nummer + 1} in ${id} ist leer`).toBeGreaterThan(0);
    }
  });

  /**
   * Der Weg heisst auf beiden Systemen anders. Wer die falsche Bezeichnung
   * sucht, findet sie nicht - und ein Hinweis, der ins Leere fuehrt, ist
   * schlimmer als keiner.
   */
  it("nennt fuer iOS Safari und den Teilen-Knopf", () => {
    const text = JSON.stringify(finde("startbildschirm-ios"));

    expect(text).toContain("Safari");
    expect(text).toMatch(/Teilen/);
    expect(text).toMatch(/Zum Home-Bildschirm/);
  });

  it("nennt fuer Android Chrome und den Installationsweg", () => {
    const text = JSON.stringify(finde("startbildschirm-android"));

    expect(text).toContain("Chrome");
    expect(text).toMatch(/[Ii]nstallieren|Startbildschirm hinzufügen/);
  });

  it("enthaelt keine Platzhalter in eckigen Klammern (Regel 50)", () => {
    for (const id of ANLEITUNGEN) {
      const eintrag = finde(id)!;
      // Bewusst Feld fuer Feld statt ueber JSON.stringify: dessen Array-Klammern
      // waeren selbst ein Treffer und der Test damit immer rot.
      const texte = [eintrag.frage, eintrag.antwort, ...(eintrag.schritte ?? []), eintrag.hinweis];

      for (const text of texte) {
        expect(text ?? "", `Platzhalter in ${id}`).not.toMatch(/\[[^\]]+\]/);
      }
    }
  });
});
