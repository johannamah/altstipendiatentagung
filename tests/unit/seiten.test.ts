import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BEREICHE } from "../../src/daten/bereiche.ts";

/**
 * Genau der Fehler, der diese Arbeit ausgeloest hat: Acht Kacheln der
 * Startseite fuehrten ins Leere, weil die zugehoerigen Seiten fehlten. Das
 * faellt beim Entwickeln nicht auf - man klickt die eigene neue Seite an, nicht
 * die sieben anderen.
 */

const seitenVerzeichnis = fileURLToPath(new URL("../../src/pages", import.meta.url));
const seiten = readdirSync(seitenVerzeichnis);

describe("Bereiche und Seiten", () => {
  it.each(BEREICHE.map((bereich) => [bereich.titel, bereich.slug] as const))(
    "Kachel %s führt auf eine Seite, die es gibt",
    (_titel, slug) => {
      expect(seiten, `src/pages/${slug}.astro fehlt`).toContain(`${slug}.astro`);
    },
  );

  it("es gibt keine Seite ohne Kachel", () => {
    const verlinkt = new Set([...BEREICHE.map((bereich) => bereich.slug), "index"]);
    const verwaist = seiten
      .filter((datei) => datei.endsWith(".astro"))
      .map((datei) => datei.replace(/\.astro$/, ""))
      .filter((name) => !verlinkt.has(name));

    expect(verwaist, `nicht von der Startseite erreichbar: ${verwaist.join(", ")}`).toEqual([]);
  });
});

/**
 * Platzhalter in eckigen Klammern stammen aus dem urspruenglichen Entwurf und
 * sind Arbeitsauftraege an das Orga-Team. Sie duerfen in den Daten stehen -
 * aber niemals ungefiltert in der Ausgabe landen (Regel 50).
 */
describe("Platzhalter", () => {
  const inhalte = fileURLToPath(new URL("../../src/content", import.meta.url));

  it("werden in den Inhaltsdaten als eckige Klammern gefuehrt", () => {
    const exkursionen = readFileSync(`${inhalte}/exkursionen.json`, "utf8");
    expect(exkursionen).toContain("[Treffpunkt einfügen");
  });

  it.each(["anmeldung", "kontakt"])(
    "%s.astro erkennt Platzhalter und ersetzt sie durch Klartext",
    (seite) => {
      const quelle = readFileSync(`${seitenVerzeichnis}/${seite}.astro`, "utf8");

      expect(quelle).toContain("istPlatzhalter");
      expect(quelle).toMatch(/startsWith\("\["\)/);
    },
  );
});
