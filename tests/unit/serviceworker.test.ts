import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BEREICHE, SEITENBEREICHE } from "../../src/daten/bereiche.ts";
import { RECHTLICHES } from "../../src/daten/rechtliches.ts";
import { serviceWorkerQuelle, vorabAdressen } from "../../src/lib/serviceworker.ts";

/**
 * Die zweite Haelfte von ADR-0002: Ohne Service Worker ist die installierte App
 * bei schlechtem Netz genauso leer wie die Website - und A5 sagt, dass das Netz
 * in der Tagungsstaette unzuverlaessig ist.
 *
 * Geprueft wird hier die ERZEUGUNG (welche Adressen, welche Strategie). Dass
 * offline tatsaechlich etwas erscheint, prueft tests/e2e/offline.spec.ts im
 * echten Browser - beides ist noetig, denn eine korrekte Liste nuetzt nichts,
 * wenn der Browser den Worker nie aktiviert.
 */

const adressen = vorabAdressen();
const quelle = serviceWorkerQuelle("pruefstand", adressen);

describe("Vorab gespeicherte Adressen", () => {
  it("enthalten die Startseite", () => {
    expect(adressen).toContain("/");
  });

  /**
   * Genau der Fehler, den seiten.test.ts fuer die Kacheln abfaengt, nur eine
   * Ebene tiefer: Ein neuer Bereich ohne Eintrag hier ist online unauffaellig
   * und offline leer.
   */
  it.each(SEITENBEREICHE.map((b) => [b.titel, `/${b.slug}/`] as const))(
    "enthalten den Bereich %s",
    (_titel, pfad) => {
      expect(adressen).toContain(pfad);
    },
  );

  it.each(RECHTLICHES.map((s) => [s.titel, `/${s.slug}/`] as const))(
    "enthalten die Pflichtangabe %s",
    (_titel, pfad) => {
      expect(adressen).toContain(pfad);
    },
  );

  /** Eine Kachel mit externem Ziel hat keine Seite - vorab laden ginge ins Leere. */
  it("enthalten keine Kacheln mit externem Ziel", () => {
    for (const bereich of BEREICHE.filter((b) => b.extern !== undefined)) {
      expect(adressen).not.toContain(`/${bereich.slug}/`);
    }
  });

  it("sind absolute Pfade ohne Dubletten", () => {
    for (const adresse of adressen) {
      expect(adresse.startsWith("/"), `${adresse} ist nicht absolut`).toBe(true);
    }
    expect(new Set(adressen).size).toBe(adressen.length);
  });

  /**
   * Die Icons des Manifests muessen offline verfuegbar sein, sonst zeigt die
   * installierte App auf dem Startbildschirm ein leeres Symbol.
   */
  it("enthalten jedes Icon aus dem Manifest", () => {
    const manifest = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../../public/site.webmanifest", import.meta.url)),
        "utf8",
      ),
    ) as { icons: { src: string }[] };

    for (const icon of manifest.icons) {
      expect(adressen, `${icon.src} fehlt im Vorabspeicher`).toContain(icon.src);
    }
  });
});

describe("Erzeugte Worker-Quelle", () => {
  it("traegt die uebergebene Fassung", () => {
    expect(quelle).toContain("pruefstand");
  });

  it("nennt jede vorab zu speichernde Adresse", () => {
    for (const adresse of adressen) {
      expect(quelle, `${adresse} fehlt in der Quelle`).toContain(`"${adresse}"`);
    }
  });

  it("behandelt Installation, Aktivierung und Abrufe", () => {
    for (const ereignis of ["install", "activate", "fetch"]) {
      expect(quelle, `Behandlung von ${ereignis} fehlt`).toContain(`"${ereignis}"`);
    }
  });

  /**
   * Produktprinzip 1 und die ausdrueckliche Warnung in ADR-0002: Ein Worker,
   * der Seiten aus dem Cache bevorzugt, liefert veraltete Programmdaten aus.
   * Seiten muessen deshalb zuerst aus dem Netz kommen.
   */
  it("holt Seitenaufrufe zuerst aus dem Netz", () => {
    expect(quelle).toMatch(/navigate/);
    expect(quelle).toMatch(/netzZuerst/);
  });

  /**
   * Gebaute Dateien tragen einen Inhaltshash im Namen - eine getroffene Adresse
   * ist dort nie veraltet. Geprueft wird die Strategie, nicht der Pfad: WELCHE
   * Ordner Astro erzeugt, ist ein Implementierungsdetail.
   */
  it("beantwortet Dateien ausserhalb von Seitenaufrufen aus dem Cache", () => {
    expect(quelle).toMatch(/cacheZuerst/);
    expect(quelle).toMatch(/respondWith\(cacheZuerst/);
  });

  it("fasst nur GET-Anfragen an - POST darf nie aus dem Cache kommen", () => {
    expect(quelle).toMatch(/"GET"/);
  });

  it("raeumt Speicher aelterer Fassungen ab", () => {
    expect(quelle).toMatch(/caches\.delete/);
  });

  it("enthaelt keine unaufgeloesten Platzhalter", () => {
    expect(quelle).not.toContain("${");
  });
});
