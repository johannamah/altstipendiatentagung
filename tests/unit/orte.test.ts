import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  alsKartenpunkte,
  appleKartenVerweis,
  googleMapsVerweis,
  istGenauBestimmt,
  vollstaendigeAdresse,
  type Ort,
} from "../../src/lib/orte.ts";

const novotel: Ort = {
  id: "novotel",
  name: "Novotel Hildesheim",
  adresse: "Bahnhofsallee 38",
  plz: "31134",
  stadt: "Hildesheim",
  art: "tagungsort",
};

const ohneAdresse: Ort = {
  id: "bosch",
  name: "Bosch Hildesheim",
  stadt: "Hildesheim",
  art: "exkursion",
};

describe("vollstaendigeAdresse", () => {
  it("setzt Strasse, Postleitzahl und Stadt zusammen", () => {
    expect(vollstaendigeAdresse(novotel)).toBe("Bahnhofsallee 38, 31134 Hildesheim");
  });

  it("laesst fehlende Teile weg, statt Luecken zu zeigen", () => {
    expect(vollstaendigeAdresse(ohneAdresse)).toBe("Hildesheim");
  });
});

describe("istGenauBestimmt", () => {
  /**
   * Der Unterschied entscheidet, ob die Weiterleitung einen Punkt trifft oder
   * nach dem Namen sucht. Beides ist brauchbar - aber die Oberflaeche muss
   * sagen, was von beidem sie tut.
   */
  it("verlangt Adresse oder Koordinaten", () => {
    expect(istGenauBestimmt(novotel)).toBe(true);
    expect(istGenauBestimmt(ohneAdresse)).toBe(false);
    expect(istGenauBestimmt({ ...ohneAdresse, koordinaten: { breite: 52, laenge: 9 } })).toBe(true);
  });
});

describe("Verweise ohne Strasse", () => {
  /**
   * Fuer einen benannten Betrieb ist die Namenssuche zuverlaessig genug:
   * "Zur Scharfen Ecke, Hildesheim" findet jede Karten-App. Frueher gab es
   * hier gar keinen Verweis - das war zu streng.
   */
  it("sucht nach Name und Stadt", () => {
    const lokal: Ort = {
      id: "scharfe-ecke",
      name: "Zur Scharfen Ecke",
      stadt: "Hildesheim",
      art: "gastronomie",
    };

    expect(decodeURIComponent(googleMapsVerweis(lokal).split("query=")[1]!)).toBe(
      "Zur Scharfen Ecke, Hildesheim",
    );
    expect(new URL(appleKartenVerweis(lokal)).searchParams.get("address")).toBe("Hildesheim");
  });
});

describe("googleMapsVerweis", () => {
  it("nutzt das dokumentierte Suchmuster", () => {
    expect(googleMapsVerweis(novotel)).toContain(
      "https://www.google.com/maps/search/?api=1&query=",
    );
  });

  it("maskiert Sonderzeichen in der Adresse", () => {
    const verweis = googleMapsVerweis(novotel);

    expect(verweis).not.toContain(" ");
    expect(decodeURIComponent(verweis.split("query=")[1]!)).toBe(
      "Novotel Hildesheim, Bahnhofsallee 38, 31134 Hildesheim",
    );
  });

  /** Koordinaten sind eindeutig, eine Adresse muss erst gedeutet werden. */
  it("bevorzugt Koordinaten, wenn vorhanden", () => {
    const mitKoordinaten = { ...novotel, koordinaten: { breite: 52.1553, laenge: 9.9512 } };

    expect(googleMapsVerweis(mitKoordinaten)).toContain("52.1553%2C9.9512");
  });
});

describe("appleKartenVerweis", () => {
  it("nutzt das dokumentierte Muster mit Name und Adresse", () => {
    const verweis = appleKartenVerweis(novotel);

    expect(verweis).toContain("https://maps.apple.com/?");
    const felder = new URL(verweis).searchParams;
    expect(felder.get("q")).toBe("Novotel Hildesheim");
    expect(felder.get("address")).toBe("Bahnhofsallee 38, 31134 Hildesheim");
  });

  it("nutzt Koordinaten statt Adresse, wenn vorhanden", () => {
    const verweis = appleKartenVerweis({
      ...novotel,
      koordinaten: { breite: 52.1553, laenge: 9.9512 },
    });
    const felder = new URL(verweis).searchParams;

    expect(felder.get("ll")).toBe("52.1553,9.9512");
    expect(felder.get("address")).toBeNull();
  });

  it("uebersteht Namen mit Sonderzeichen", () => {
    const verweis = appleKartenVerweis({
      ...novotel,
      name: "deseo Cafe . Restaurant . Bar",
    });

    expect(new URL(verweis).searchParams.get("q")).toBe("deseo Cafe . Restaurant . Bar");
  });
});

/**
 * Die Umstellung auf Ortsverweise hat 17 Schreibweisen auf 12 Orte
 * zurueckgefuehrt. Ein Tippfehler in einer ortId darf nicht still ins Leere
 * laufen - dann fehlt auf der Seite kommentarlos die Adresse.
 */
describe("Ortsverweise in den Inhaltsdaten", () => {
  const inhalte = fileURLToPath(new URL("../../src/content", import.meta.url));
  const lies = (datei: string) =>
    JSON.parse(readFileSync(`${inhalte}/${datei}`, "utf8")) as Array<Record<string, unknown>>;

  const bekannteOrte = new Set(lies("orte.json").map((ort) => ort.id as string));

  it.each(["programm.json", "exkursionen.json", "unterkuenfte.json"])(
    "%s verweist nur auf vorhandene Orte",
    (datei) => {
      const unbekannt = lies(datei)
        .map((eintrag) => eintrag.ortId as string | undefined)
        .filter(
          (kennung): kennung is string => kennung !== undefined && !bekannteOrte.has(kennung),
        );

      expect(unbekannt, `unbekannte ortId: ${unbekannt.join(", ")}`).toEqual([]);
    },
  );

  /**
   * Gastronomie ist ausgenommen: Diese Orte werden nicht ueber ortId
   * verknuepft, sondern auf der Hildesheim-Seite nach Art ausgegeben.
   */
  it("jeder tagungsrelevante Ort wird mindestens einmal verwendet", () => {
    const verwendet = new Set(
      ["programm.json", "exkursionen.json", "unterkuenfte.json"]
        .flatMap(lies)
        .map((eintrag) => eintrag.ortId as string | undefined)
        .filter(Boolean),
    );
    const nurGastronomie = new Set(
      lies("orte.json")
        .filter((ort) => ort.art === "gastronomie")
        .map((ort) => ort.id as string),
    );
    const verwaist = [...bekannteOrte].filter(
      (kennung) => !verwendet.has(kennung) && !nurGastronomie.has(kennung),
    );

    expect(verwaist, `nirgends verwendet: ${verwaist.join(", ")}`).toEqual([]);
  });
});

describe("alsKartenpunkte", () => {
  const mit = (id: string, breite: number, laenge: number): Ort => ({
    id,
    name: id,
    stadt: "Hildesheim",
    art: "exkursion",
    koordinaten: { breite, laenge },
  });

  it("liefert nichts, wenn keine Koordinaten vorliegen", () => {
    expect(alsKartenpunkte([novotel, ohneAdresse])).toEqual([]);
  });

  it("uebergeht Orte ohne Koordinaten, statt sie falsch zu setzen", () => {
    const punkte = alsKartenpunkte([mit("a", 52.15, 9.95), ohneAdresse]);

    expect(punkte.map((p) => p.ort.id)).toEqual(["a"]);
  });

  it("legt alle Punkte in das Zeichenfeld", () => {
    const punkte = alsKartenpunkte([
      mit("nord", 52.36, 9.75),
      mit("mitte", 52.15, 9.95),
      mit("sued", 51.99, 9.82),
    ]);

    for (const punkt of punkte) {
      expect(punkt.x).toBeGreaterThanOrEqual(0);
      expect(punkt.x).toBeLessThanOrEqual(100);
      expect(punkt.y).toBeGreaterThanOrEqual(0);
      expect(punkt.y).toBeLessThanOrEqual(100);
    }
  });

  /** Norden ist oben: groessere Breite heisst kleineres y. */
  it("zeichnet Norden nach oben", () => {
    const punkte = alsKartenpunkte([mit("hannover", 52.36, 9.75), mit("alfeld", 51.99, 9.82)]);
    const hannover = punkte.find((p) => p.ort.id === "hannover")!;
    const alfeld = punkte.find((p) => p.ort.id === "alfeld")!;

    expect(hannover.y).toBeLessThan(alfeld.y);
  });

  /**
   * Auf 52 Grad Nord ist ein Grad Laenge nur rund 62 Prozent so lang wie ein
   * Grad Breite. Ohne diese Stauchung waere die Karte in die Breite gezogen.
   */
  it("staucht die Laengengrade, statt die Karte zu verzerren", () => {
    const punkte = alsKartenpunkte([
      mit("ursprung", 52.0, 9.0),
      mit("oestlich", 52.0, 10.0),
      mit("noerdlich", 53.0, 9.0),
    ]);
    const ursprung = punkte.find((p) => p.ort.id === "ursprung")!;
    const oestlich = punkte.find((p) => p.ort.id === "oestlich")!;
    const noerdlich = punkte.find((p) => p.ort.id === "noerdlich")!;

    const westOst = Math.abs(oestlich.x - ursprung.x);
    const nordSued = Math.abs(noerdlich.y - ursprung.y);

    // Ein Grad Laenge muss kuerzer gezeichnet werden als ein Grad Breite.
    expect(westOst).toBeLessThan(nordSued);
    expect(westOst / nordSued).toBeCloseTo(Math.cos((52.5 * Math.PI) / 180), 1);
  });

  it("kommt mit einem einzelnen Ort zurecht", () => {
    const punkte = alsKartenpunkte([mit("allein", 52.15, 9.95)]);

    expect(punkte).toHaveLength(1);
    expect(Number.isFinite(punkte[0]!.x)).toBe(true);
    expect(Number.isFinite(punkte[0]!.y)).toBe(true);
  });
});
