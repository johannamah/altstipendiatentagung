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
