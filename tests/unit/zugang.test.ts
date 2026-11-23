import { describe, expect, it } from "vitest";

import { SALZ, zugangshash } from "../../src/lib/zugang.ts";

/**
 * Die Sperre ist eine Sichtbarkeitsbarriere gegen zufaelliges Auffinden,
 * KEIN Zugriffsschutz (ADR-0010): Das HTML steht im Antwortkoerper und laesst
 * sich mit jedem Werkzeug auslesen, das kein JavaScript ausfuehrt.
 *
 * Was sie leisten MUSS: Das Zugangswort darf nirgends im Ergebnis stehen. Das
 * Repository ist oeffentlich, und AGENTS.md verbietet Secrets im Commit - ein
 * Wort im Klartext waere nicht bloss schwach, sondern sofort oeffentlich.
 */

const WORT = "Ein Beispielwort 1876";

describe("Zugangshash", () => {
  it("ist ohne gesetztes Zugangswort nicht vorhanden - die Sperre bleibt aus", () => {
    expect(zugangshash(undefined)).toBeNull();
    expect(zugangshash("")).toBeNull();
    expect(zugangshash("   ")).toBeNull();
  });

  it("ergibt einen SHA-256-Wert in hexadezimaler Schreibweise", () => {
    expect(zugangshash(WORT)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ist fuer dasselbe Wort stabil und fuer ein anderes verschieden", () => {
    expect(zugangshash(WORT)).toBe(zugangshash(WORT));
    expect(zugangshash(WORT)).not.toBe(zugangshash(`${WORT} `.trim() + "x"));
  });

  /** Der eigentliche Zweck dieses Tests. */
  it("enthaelt das Zugangswort nicht - auch nicht in Teilen", () => {
    const hash = zugangshash(WORT)!;

    expect(hash).not.toContain("Beispielwort");
    expect(hash.toLowerCase()).not.toContain("1876");
  });

  /**
   * Ohne Salz liesse sich ein kurzes Wort in Sekunden ueber eine fertige
   * Hashtabelle nachschlagen. Das Salz macht das nicht unmoeglich, aber es
   * zwingt zu einem gezielten Angriff auf genau dieses Projekt.
   */
  it("bezieht ein projektweites Salz ein", () => {
    expect(SALZ.length).toBeGreaterThanOrEqual(8);

    const ohneSalz = "d404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176";
    expect(zugangshash("abc")).not.toBe(ohneSalz);
  });

  it("behandelt fuehrende und nachgestellte Leerzeichen als unerheblich", () => {
    expect(zugangshash(`  ${WORT}  `)).toBe(zugangshash(WORT));
  });
});

/**
 * Das Zugangswort des Vereins enthaelt einen Umlaut. In Unicode gibt es dafuer
 * zwei Schreibweisen - je nach Tastatur und Betriebssystem kommt die eine oder
 * die andere an. Ohne Vereinheitlichung scheitert dieselbe Eingabe mal und
 * gelingt mal, und niemand faende den Grund.
 */
describe("Umlaute", () => {
  it("behandelt beide Unicode-Schreibweisen als dasselbe Wort", () => {
    const alsEinZeichen = "Rhöndorf";
    const alsOPlusTrema = "Rhöndorf";

    expect(alsEinZeichen).not.toBe(alsOPlusTrema);
    expect(zugangshash(alsOPlusTrema)).toBe(zugangshash(alsEinZeichen));
  });
});
