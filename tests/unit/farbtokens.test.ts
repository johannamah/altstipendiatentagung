import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { AA, kontrastVerhaeltnis } from "../../src/lib/kontrast.ts";

/**
 * Dieser Test setzt Regel 18 aus `docs/ui-ux-designregeln.md` durch:
 * mindestens 4,5:1 fuer Text und 3:1 fuer Bedienelemente - in BEIDEN Darstellungen.
 *
 * Er prueft die Tokendatei selbst, nicht eine Kopie ihrer Werte. Eine Farbaenderung,
 * die den Kontrast bricht, laesst die CI rot werden, bevor sie jemanden erreicht.
 */

const TOKEN_DATEI = fileURLToPath(new URL("../../src/styles/tokens.css", import.meta.url));
const css = readFileSync(TOKEN_DATEI, "utf8");

/** Liest alle `--name: #hex;`-Deklarationen aus dem uebergebenen CSS-Abschnitt. */
function farbtokens(abschnitt: string): Map<string, string> {
  const gefunden = new Map<string, string>();
  const muster = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g;
  let treffer: RegExpExecArray | null;

  while ((treffer = muster.exec(abschnitt)) !== null) {
    gefunden.set(treffer[1]!, treffer[2]!);
  }

  return gefunden;
}

/** Schneidet den Block heraus, der auf `einleitung` folgt (bis zur schliessenden Klammer). */
function block(einleitung: string): string {
  const start = css.indexOf(einleitung);
  expect(start, `Block nicht gefunden: ${einleitung}`).toBeGreaterThan(-1);

  let tiefe = 0;
  let index = css.indexOf("{", start);
  const anfang = index;

  for (; index < css.length; index += 1) {
    if (css[index] === "{") tiefe += 1;
    if (css[index] === "}") {
      tiefe -= 1;
      if (tiefe === 0) return css.slice(anfang, index);
    }
  }

  throw new Error(`Block nicht geschlossen: ${einleitung}`);
}

const alle = farbtokens(css);

/** Rollen der hellen Darstellung: alles ohne `d-`-Praefix. */
const hell = new Map([...alle].filter(([name]) => !name.startsWith("d-")));
/** Rollen der dunklen Darstellung: `--d-x` wird auf `x` zurueckgefuehrt. */
const dunkel = new Map(
  [...alle].filter(([name]) => name.startsWith("d-")).map(([name, wert]) => [name.slice(2), wert]),
);

/** Paare, die eingehalten werden muessen: [Vordergrund, Hintergrund, Mindestkontrast]. */
const PAARE: ReadonlyArray<readonly [string, string, number]> = [
  ["text", "flaeche", AA.text],
  ["text", "karte", AA.text],
  ["text", "feld", AA.text],
  ["text", "hover", AA.text],
  ["text-leise", "flaeche", AA.text],
  ["text-leise", "karte", AA.text],
  ["akzent", "karte", AA.text],
  ["akzent", "flaeche", AA.text],
  ["ueberschrift", "karte", AA.text],
  ["ueberschrift", "flaeche", AA.text],
  ["hinweis-text", "hinweis-flaeche", AA.text],
  ["schlagwort-text", "schlagwort-flaeche", AA.text],
  ["toast-text", "toast-flaeche", AA.text],
  // Bedienelemente und Zustandsgrenzen brauchen 3:1 (WCAG 1.4.11).
  ["feldrand", "feld", AA.bedienelement],
  ["feldrand", "karte", AA.bedienelement],
  ["fokus", "flaeche", AA.bedienelement],
  ["fokus", "karte", AA.bedienelement],
];

describe.each([
  ["helle Darstellung", hell],
  ["dunkle Darstellung", dunkel],
])("%s", (_name, palette) => {
  it.each(PAARE)("%s auf %s erreicht mindestens %s:1", (vordergrund, hintergrund, minimum) => {
    const vg = palette.get(vordergrund);
    const hg = palette.get(hintergrund);

    expect(vg, `Token --${vordergrund} fehlt in dieser Darstellung`).toBeDefined();
    expect(hg, `Token --${hintergrund} fehlt in dieser Darstellung`).toBeDefined();

    expect(kontrastVerhaeltnis(vg!, hg!)).toBeGreaterThanOrEqual(minimum);
  });
});

describe("Kacheln", () => {
  const namen = [...hell.keys()]
    .filter((name) => name.startsWith("kachel-") && name.endsWith("-von"))
    .map((name) => name.slice("kachel-".length, -"-von".length));

  it("es gibt ueberhaupt Kacheln zu pruefen", () => {
    expect(namen.length).toBeGreaterThan(0);
  });

  /**
   * Jede Kachel ist ein Farbverlauf mit eigener Textfarbe. Geprueft werden BEIDE
   * Endpunkte: Der Text muss ueber die gesamte Flaeche lesbar sein, nicht nur dort,
   * wo der Verlauf guenstig steht.
   */
  it.each(namen)("Kachel %s: Text ist auf beiden Verlaufsenden lesbar", (kachel) => {
    const von = hell.get(`kachel-${kachel}-von`);
    const bis = hell.get(`kachel-${kachel}-bis`);
    const text = hell.get(`kachel-${kachel}-text`);

    expect(von, `--kachel-${kachel}-von fehlt`).toBeDefined();
    expect(bis, `--kachel-${kachel}-bis fehlt`).toBeDefined();
    expect(text, `--kachel-${kachel}-text fehlt`).toBeDefined();

    expect(kontrastVerhaeltnis(text!, von!)).toBeGreaterThanOrEqual(AA.text);
    expect(kontrastVerhaeltnis(text!, bis!)).toBeGreaterThanOrEqual(AA.text);
  });
});

describe("Aufbau der Tokendatei", () => {
  it("die Markenfarbe aus dem Vereinslogo ist unveraendert", () => {
    // AGENTS.md: Logos und offizielle Farbwerte werden nicht veraendert.
    // Abgeleitete Ergaenzungsfarben duerfen zugunsten des Kontrasts abweichen.
    expect(hell.get("marke-blau")).toBe("#004684");
  });

  it("zu jeder hellen Rolle mit Kontrastanspruch gibt es eine dunkle Entsprechung", () => {
    const gepruefteRollen = new Set(PAARE.flatMap(([vg, hg]) => [vg, hg]));

    for (const rolle of gepruefteRollen) {
      expect(
        dunkel.has(rolle),
        `--d-${rolle} fehlt - die dunkle Darstellung waere unvollstaendig`,
      ).toBe(true);
    }
  });

  /**
   * Die dunkle Palette wird einmal definiert und an zwei Stellen zugewiesen:
   * per Systemeinstellung und per Handschalter. Laufen die beiden Zuweisungen
   * auseinander, faellt das sonst niemandem auf - ausser den Nutzenden.
   */
  it("Systemautomatik und Handschalter weisen dieselben Rollen zu", () => {
    const zuweisungen = (abschnitt: string) =>
      new Set([...abschnitt.matchAll(/--([a-z0-9-]+)\s*:\s*var\(--d-/g)].map((t) => t[1]!));

    const automatik = zuweisungen(block("@media (prefers-color-scheme: dark)"));
    const handschalter = zuweisungen(block(':root[data-theme="dunkel"]'));

    expect(automatik.size).toBeGreaterThan(0);
    expect([...handschalter].sort()).toEqual([...automatik].sort());
  });
});
