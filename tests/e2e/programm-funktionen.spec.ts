import { expect, test } from "@playwright/test";

/**
 * Tests fuer "Jetzt laeuft" (#3) und "Mein Programm" (#4).
 *
 * Die Uhr wird fest gesetzt: Ein Test, der vom echten Datum abhaengt, waere
 * heute gruen und am Tag nach der Tagung rot.
 */

/** 07.05.2027, 14:00 Uhr Ortszeit = 12:00 Uhr UTC (Sommerzeit). */
const WAEHREND_DER_EXKURSIONEN = new Date(Date.UTC(2027, 4, 7, 12, 0));
/** Lange vor der Tagung. */
const WEIT_VORHER = new Date(Date.UTC(2026, 10, 1, 9, 0));

test.describe("Jetzt läuft", () => {
  /* Ohne reduzierte Bewegung scrollt die Seite weich, und toBeInViewport wird
     zum Rennen gegen die Animation - der Test war in der CI entsprechend
     flackrig. Mit reduzierter Bewegung springt die Ansicht, und nebenbei ist
     genau der Pfad geprueft, den Regel 37 verlangt. */
  test.use({ reducedMotion: "reduce" });

  test("markiert die laufenden Exkursionen und springt hin", async ({ page }) => {
    await page.clock.setFixedTime(WAEHREND_DER_EXKURSIONEN);
    await page.goto("/programm");

    const laufende = page.locator('.punkt[data-lage="jetzt"]');

    // Sieben parallele Exkursionen laufen zu dieser Zeit.
    await expect(laufende).toHaveCount(7);
    await expect(laufende.first()).toBeInViewport();
    await expect(laufende.first().getByText("Jetzt")).toBeVisible();
  });

  test("markiert nichts ausserhalb des Tagungszeitraums", async ({ page }) => {
    await page.clock.setFixedTime(WEIT_VORHER);
    await page.goto("/programm");

    await expect(page.locator(".punkt[data-lage]")).toHaveCount(0);
  });

  /**
   * In einer Pause soll der naechste Punkt hervorgehoben werden - wer aufs
   * Telefon schaut, will wissen, wo er als Naechstes hinmuss.
   */
  test("hebt in einer Pause den naechsten Punkt hervor", async ({ page }) => {
    // 07.05.2027, 19:00 Uhr Ortszeit: Exkursionen vorbei, Weinfest ab 21:00 Uhr.
    await page.clock.setFixedTime(new Date(Date.UTC(2027, 4, 7, 17, 0)));
    await page.goto("/programm");

    await expect(page.locator('.punkt[data-lage="jetzt"]')).toHaveCount(0);
    const naechster = page.locator('.punkt[data-lage="danach"]');
    await expect(naechster).toHaveCount(1);
    await expect(naechster.getByText("Als Nächstes")).toBeVisible();
  });
});

test.describe("Mein Programm", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(WEIT_VORHER);
    await page.goto("/programm");
  });

  test("merkt einen Punkt und behaelt ihn nach dem Neuladen", async ({ page }) => {
    const punkt = page.locator('.punkt[data-id="exkursion-fagus"]');
    const merken = punkt.getByRole("button", { name: /Merken/ });

    await expect(merken).toHaveAttribute("aria-pressed", "false");
    await merken.click();

    await expect(punkt.getByRole("button", { name: /Gemerkt/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("status")).toContainText("zu eurem Programm hinzugefügt");

    // Regel 32: Die Auswahl muss einen Neuaufbau ueberstehen.
    await page.reload();
    await expect(
      page.locator('.punkt[data-id="exkursion-fagus"]').getByRole("button", { name: /Gemerkt/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("filtert auf die eigene Auswahl und wieder zurueck", async ({ page }) => {
    await page
      .locator('.punkt[data-id="konzert"]')
      .getByRole("button", { name: /Merken/ })
      .click();
    await page.getByRole("button", { name: "Nur mein Programm" }).click();

    await expect(page.locator(".punkt:visible")).toHaveCount(1);
    await expect(page.locator('.punkt[data-id="konzert"]')).toBeVisible();

    await page.getByRole("button", { name: "Ganzes Programm" }).click();
    await expect(page.locator(".punkt:visible").first()).toBeVisible();
    expect(await page.locator(".punkt:visible").count()).toBeGreaterThan(1);
  });

  /** Regel 23: Ein Leerzustand erklaert, wie es weitergeht. */
  test("erklaert den leeren Zustand", async ({ page }) => {
    await page.getByRole("button", { name: "Nur mein Programm" }).click();

    await expect(page.getByRole("status")).toContainText("noch nichts gemerkt");
  });

  test("weist darauf hin, dass die Auswahl nur auf dem Geraet liegt", async ({ page }) => {
    await expect(page.getByText(/nur auf diesem Gerät/)).toBeVisible();
  });

  test("der Sammel-Export ist erst mit Auswahl bedienbar", async ({ page }) => {
    const knopf = page.getByRole("button", { name: /Mein Programm in den Kalender/ });

    await expect(knopf).toBeDisabled();
    await page
      .locator('.punkt[data-id="konzert"]')
      .getByRole("button", { name: /Merken/ })
      .click();
    await expect(knopf).toBeEnabled();
  });
});

test.describe("Kalender-Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(WEIT_VORHER);
    await page.goto("/programm");
  });

  test("laedt einen einzelnen Punkt als .ics herunter", async ({ page }) => {
    const download = page.waitForEvent("download");

    await page
      .locator('.punkt[data-id="exkursion-fagus"]')
      .getByRole("button", { name: /Zum Kalender/ })
      .click();

    const datei = await download;
    expect(datei.suggestedFilename()).toBe("jahrestagung-2027-exkursion-fagus.ics");
  });

  /**
   * Ein Punkt ohne Endzeit bekaeme im Kalender eine erfundene Dauer - deshalb
   * gibt es dort gar keinen Knopf (Produktprinzip 1).
   */
  test("bietet keinen Export fuer Punkte ohne belastbare Zeit", async ({ page }) => {
    const weinfest = page.locator('.punkt[data-id="weinfest"]');

    await expect(weinfest).toBeVisible();
    await expect(weinfest.getByRole("button", { name: /Zum Kalender/ })).toHaveCount(0);
  });

  test("laedt die gesamte Auswahl als eine Datei herunter", async ({ page }) => {
    await page
      .locator('.punkt[data-id="konzert"]')
      .getByRole("button", { name: /Merken/ })
      .click();
    await page
      .locator('.punkt[data-id="panel-nie-wieder"]')
      .getByRole("button", { name: /Merken/ })
      .click();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Mein Programm in den Kalender/ }).click();

    const datei = await download;
    expect(datei.suggestedFilename()).toBe("jahrestagung-2027-mein-programm.ics");
  });
});

/**
 * Ohne JavaScript darf kein Knopf erscheinen, der nichts tut - das Programm
 * selbst muss aber vollstaendig lesbar bleiben.
 */
test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("das Programm ist lesbar, die Bedienelemente bleiben verborgen", async ({ page }) => {
    await page.goto("/programm");

    await expect(page.getByRole("heading", { name: "Freitag, 7. Mai 2027" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Merken/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nur mein Programm" })).toHaveCount(0);
  });
});

/** Tests fuer die proportionale Zeitachse (#5). */
test.describe("Zeitachse", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(WEIT_VORHER);
    await page.goto("/programm");
  });

  test("laesst sich ein- und wieder ausschalten", async ({ page }) => {
    const umschalter = page.getByRole("button", { name: "Als Zeitachse" });

    await expect(umschalter).toHaveAttribute("aria-pressed", "false");
    await umschalter.click();

    await expect(page.locator("html")).toHaveAttribute("data-ansicht", "achse");
    await expect(page.getByRole("button", { name: "Als Liste" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Als Liste" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-ansicht", /.+/);
  });

  /**
   * Der Kern von #5: Die Hoehe folgt der Dauer. Das Panel am Freitag dauert
   * 90 Minuten, die Kaffeepause am Donnerstag 30 - in der Liste sehen beide
   * gleich aus.
   */
  test("bildet die Dauer in der Hoehe ab", async ({ page }) => {
    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    const langerPunkt = page.locator('.punkt[data-id="panel-europa-unter-druck"]');
    const kurzerPunkt = page.locator('.punkt[data-id="kaffeepause-donnerstag"]');

    const lang = await langerPunkt.boundingBox();
    const kurz = await kurzerPunkt.boundingBox();

    expect(lang!.height).toBeGreaterThan(kurz!.height * 2);
  });

  test("stellt gleichzeitige Exkursionen nebeneinander", async ({ page }) => {
    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    const freitag = page.locator("#tag-2027-05-07 .tagesliste");
    await expect(freitag).toHaveAttribute("data-straenge", "7");

    const erste = await page.locator('.punkt[data-id="exkursion-dom"]').boundingBox();
    const zweite = await page.locator('.punkt[data-id="exkursion-fagus"]').boundingBox();

    // Nebeneinander heisst: unterschiedliche x-Position, gleiche Hoehe im Raster.
    expect(erste!.x).not.toBe(zweite!.x);
    expect(Math.abs(erste!.y - zweite!.y)).toBeLessThan(5);
  });

  /** Regel 10: Der Bereich darf scrollen, die Seite nicht. */
  test("scrollt nur den Tagesbereich, nie die Seite", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    /* Nicht nur "die Seite ist zu breit" melden, sondern das breiteste Element
       UND ob ein Vorfahr es eigentlich beschneiden muesste. Ohne diese beiden
       Angaben ist ein roter Lauf in der CI eine Sackgasse, solange sich lokal
       kein Browser starten laesst. */
    const befund = await page.evaluate(() => {
      const breite = document.documentElement.clientWidth;

      const beschreibe = (element: Element) => {
        const klasse = element.className?.toString().split(" ")[0] || "(ohne Klasse)";
        return `${element.tagName.toLowerCase()}.${klasse}`;
      };

      const scrollVorfahr = (element: Element) => {
        for (let eltern = element.parentElement; eltern; eltern = eltern.parentElement) {
          const stil = getComputedStyle(eltern);
          if (stil.overflowX !== "visible") {
            return `${beschreibe(eltern)} (overflow-x: ${stil.overflowX})`;
          }
        }
        return "keiner";
      };

      const taeter = [...document.querySelectorAll("body *")]
        .map((element) => ({ element, rechts: element.getBoundingClientRect().right }))
        .filter((eintrag) => eintrag.rechts > breite + 1)
        .sort((a, b) => b.rechts - a.rechts)
        .slice(0, 4)
        .map(
          (eintrag) =>
            `${beschreibe(eintrag.element)} bis ${Math.round(eintrag.rechts)}px, beschnitten von: ${scrollVorfahr(eintrag.element)}`,
        );

      return { ueberbreite: document.documentElement.scrollWidth - breite, taeter };
    });

    expect(
      befund.ueberbreite,
      `Die Seite ist ${befund.ueberbreite}px zu breit.\n  ${befund.taeter.join("\n  ") || "kein Element ragt über den Rand"}`,
    ).toBeLessThanOrEqual(0);

    const bereichScrollt = await page.evaluate(() => {
      const bereich = document.querySelector("#tag-2027-05-07 .tagesbereich");
      return bereich !== null && bereich.scrollWidth > bereich.clientWidth;
    });
    expect(bereichScrollt).toBe(true);
  });

  test("der scrollbare Bereich ist mit der Tastatur erreichbar", async ({ page }) => {
    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    const bereich = page.locator("#tag-2027-05-07 .tagesbereich");
    await expect(bereich).toHaveAttribute("tabindex", "0");
    await bereich.focus();
    await expect(bereich).toBeFocused();
  });

  /**
   * Die visuelle Parallelitaet darf die Reihenfolge im Dokument nicht
   * durcheinanderbringen - sonst liest ein Screenreader den Tag in einer
   * anderen Folge als er stattfindet.
   */
  test("aendert die Reihenfolge im Dokument nicht", async ({ page }) => {
    const alsListe = await page
      .locator("#tag-2027-05-07 .punkt")
      .evaluateAll((elemente) => elemente.map((element) => (element as HTMLElement).dataset.id));

    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    const alsAchse = await page
      .locator("#tag-2027-05-07 .punkt")
      .evaluateAll((elemente) => elemente.map((element) => (element as HTMLElement).dataset.id));

    expect(alsAchse).toEqual(alsListe);
  });

  test("erklaert die Ansicht beim Umschalten", async ({ page }) => {
    await page.getByRole("button", { name: "Als Zeitachse" }).click();

    await expect(page.getByRole("status")).toContainText("Höhe zeigt die Dauer");
  });
});
