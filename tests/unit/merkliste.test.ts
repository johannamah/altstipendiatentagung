import { describe, expect, it } from "vitest";

import {
  ladeAuswahl,
  speichereAuswahl,
  umschalten,
  type Speicher,
} from "../../src/lib/merkliste.ts";

/** Ein Speicher, der sich wie localStorage verhaelt - nur im Arbeitsspeicher. */
function speicherAttrappe(inhalt: Record<string, string> = {}): Speicher {
  return {
    getItem: (schluessel) => inhalt[schluessel] ?? null,
    setItem: (schluessel, wert) => {
      inhalt[schluessel] = wert;
    },
    removeItem: (schluessel) => {
      delete inhalt[schluessel];
    },
  };
}

/** Ein Speicher, der wirft - privates Fenster, gesperrte Website-Daten. */
const werfenderSpeicher: Speicher = {
  getItem: () => {
    throw new Error("Zugriff verweigert");
  },
  setItem: () => {
    throw new Error("Zugriff verweigert");
  },
  removeItem: () => {
    throw new Error("Zugriff verweigert");
  },
};

const BEKANNT = ["programm-a", "programm-b", "programm-c"];

describe("ladeAuswahl", () => {
  it("liefert eine leere Auswahl, wenn nichts gespeichert ist", () => {
    expect(ladeAuswahl(speicherAttrappe(), BEKANNT)).toEqual([]);
  });

  it("liest eine gespeicherte Auswahl", () => {
    const speicher = speicherAttrappe({ "mein-programm": '["programm-a","programm-c"]' });

    expect(ladeAuswahl(speicher, BEKANNT)).toEqual(["programm-a", "programm-c"]);
  });

  /**
   * Aendert sich das Programm, koennen gespeicherte Kennungen ins Leere zeigen.
   * Das darf die Ansicht nicht stoeren - die unbekannten Eintraege fallen weg.
   */
  it("verwirft Kennungen, die es nicht mehr gibt", () => {
    const speicher = speicherAttrappe({ "mein-programm": '["programm-a","abgesagt"]' });

    expect(ladeAuswahl(speicher, BEKANNT)).toEqual(["programm-a"]);
  });

  it("uebersteht beschaedigte Daten", () => {
    expect(ladeAuswahl(speicherAttrappe({ "mein-programm": "kein JSON" }), BEKANNT)).toEqual([]);
    expect(ladeAuswahl(speicherAttrappe({ "mein-programm": '{"a":1}' }), BEKANNT)).toEqual([]);
    expect(ladeAuswahl(speicherAttrappe({ "mein-programm": "[1,2,3]" }), BEKANNT)).toEqual([]);
  });

  /**
   * Im privaten Fenster wirft der Zugriff. Die Programmansicht muss dann
   * vollstaendig funktionieren, nur eben ohne gemerkte Auswahl (Regel: Regel 32
   * und der Umgang mit Browserspeicher).
   */
  it("uebersteht einen Speicher, der wirft", () => {
    expect(ladeAuswahl(werfenderSpeicher, BEKANNT)).toEqual([]);
  });

  it("uebersteht einen fehlenden Speicher", () => {
    expect(ladeAuswahl(null, BEKANNT)).toEqual([]);
  });
});

describe("speichereAuswahl", () => {
  it("schreibt die Auswahl", () => {
    const inhalt: Record<string, string> = {};
    speichereAuswahl(speicherAttrappe(inhalt), ["programm-b"]);

    expect(JSON.parse(inhalt["mein-programm"]!)).toEqual(["programm-b"]);
  });

  it("entfernt den Eintrag, wenn die Auswahl leer ist", () => {
    const inhalt: Record<string, string> = { "mein-programm": '["programm-a"]' };
    speichereAuswahl(speicherAttrappe(inhalt), []);

    expect(inhalt["mein-programm"]).toBeUndefined();
  });

  it("meldet, ob das Speichern gelungen ist", () => {
    expect(speichereAuswahl(speicherAttrappe(), ["programm-a"])).toBe(true);
    expect(speichereAuswahl(werfenderSpeicher, ["programm-a"])).toBe(false);
    expect(speichereAuswahl(null, ["programm-a"])).toBe(false);
  });
});

describe("umschalten", () => {
  it("fuegt hinzu, was fehlt", () => {
    expect(umschalten(["programm-a"], "programm-b")).toEqual(["programm-a", "programm-b"]);
  });

  it("entfernt, was schon da ist", () => {
    expect(umschalten(["programm-a", "programm-b"], "programm-a")).toEqual(["programm-b"]);
  });

  it("aendert die uebergebene Liste nicht", () => {
    const vorher = ["programm-a"];
    umschalten(vorher, "programm-b");

    expect(vorher).toEqual(["programm-a"]);
  });
});
