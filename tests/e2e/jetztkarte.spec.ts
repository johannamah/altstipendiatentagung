import { expect, test } from "@playwright/test";

/**
 * Statusleiste und die Karte "Jetzt / Als Nächstes" auf der Startseite.
 *
 * Die Uhr wird fest gesetzt: Ein Test, der vom echten Datum abhängt, wäre
 * heute grün und am Tag nach der Tagung rot.
 */

/** Lange vor der Tagung. */
const VORHER = new Date(Date.UTC(2026, 10, 1, 9, 0));
/** 07.05.2027, 14:00 Uhr Ortszeit – die Exkursionen laufen. */
const WAEHREND = new Date(Date.UTC(2027, 4, 7, 12, 0));
/** 07.05.2027, 12:00 Uhr Ortszeit – Pause vor dem Exkursionsstart um 12:30. */
const PAUSE = new Date(Date.UTC(2027, 4, 7, 10, 0));
/** Nach der Tagung. */
const DANACH = new Date(Date.UTC(2027, 5, 1, 9, 0));

test.describe("Statusleiste", () => {
  test("nennt den Stand der angezeigten Inhalte", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/^Stand: \d+\. \w+, \d{2}:\d{2} Uhr$/)).toBeVisible();
  });

  /**
   * Ohne Zwischenspeicher darf dort nicht "offline verfügbar" stehen - jemand
   * verließe sich im Tagungshaus darauf.
   */
  test("behauptet keine Offline-Fähigkeit ohne Zwischenspeicher", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Offline verfügbar/)).toHaveCount(0);
  });
});

test.describe("Karte Jetzt / Als Nächstes", () => {
  test("zeigt vor der Tagung den ersten Programmpunkt", async ({ page }) => {
    await page.clock.setFixedTime(VORHER);
    await page.goto("/");

    const karte = page.locator(".jetztkarte");
    await expect(karte).toHaveAttribute("data-art", "vorher");
    await expect(karte.getByText("Zum Auftakt")).toBeVisible();
    await expect(karte.getByRole("heading")).toContainText("Get Together");
  });

  test("zeigt während der Exkursionen den laufenden Punkt", async ({ page }) => {
    await page.clock.setFixedTime(WAEHREND);
    await page.goto("/");

    const karte = page.locator(".jetztkarte");
    await expect(karte).toHaveAttribute("data-art", "jetzt");
    await expect(karte.getByText("Jetzt", { exact: true })).toBeVisible();
  });

  /**
   * Am Freitag laufen sieben Exkursionen gleichzeitig. Wer nur eine sieht,
   * hält sie für das Programm.
   */
  test("weist auf gleichzeitige Punkte hin", async ({ page }) => {
    await page.clock.setFixedTime(WAEHREND);
    await page.goto("/");

    await expect(page.locator(".jetztkarte").getByText(/weitere gleichzeitig/)).toBeVisible();
  });

  test("zeigt in einer Pause den nächsten Punkt mit Vorlauf", async ({ page }) => {
    await page.clock.setFixedTime(PAUSE);
    await page.goto("/");

    const karte = page.locator(".jetztkarte");
    await expect(karte).toHaveAttribute("data-art", "gleich");
    await expect(karte.getByText("Als Nächstes")).toBeVisible();
    await expect(karte.getByText("in 30 Min.")).toBeVisible();
  });

  /**
   * Einen vergangenen Termin zu zeigen wäre irreführend - wer die App im Juni
   * öffnet, sucht nicht nach dem Freitagvormittag.
   */
  test("sagt nach der Tagung, dass sie beendet ist", async ({ page }) => {
    await page.clock.setFixedTime(DANACH);
    await page.goto("/");

    await expect(page.locator(".jetztkarte").getByRole("heading")).toContainText("beendet");
  });

  test("führt ins Programm zum passenden Tag", async ({ page }) => {
    await page.clock.setFixedTime(WAEHREND);
    await page.goto("/");

    await page
      .locator(".jetztkarte")
      .getByRole("link", { name: /Details öffnen/ })
      .click();
    await expect(page).toHaveURL(/#tag-2027-05-07$/);
  });

  /**
   * Ohne JavaScript bleibt der serverseitig gerenderte Auftakt stehen. Eine
   * leere Fläche wäre schlechter, und falsch ist der Auftakt nie.
   */
  test.describe("ohne JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("zeigt den ersten Programmpunkt statt einer leeren Fläche", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator(".jetztkarte").getByRole("heading")).toContainText("Get Together");
    });
  });
});

test.describe("Logo im Dunkelmodus", () => {
  /**
   * Die Ausgangsdatei hat das Weiß eingebrannt und stand als harter weißer
   * Block auf der dunklen Seite. Freigestellt braucht der schwarze Schriftzug
   * aber weiterhin hellen Grund - deshalb eine gedämpfte Fläche mit runden
   * Ecken statt reinem Weiß.
   */
  test("liegt auf einer gedämpften Fläche, nicht auf reinem Weiß", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dunkel";
    });

    const flaeche = page.locator(".aufmacher-logo");
    const stil = await flaeche.evaluate((element) => {
      const berechnet = getComputedStyle(element);
      return { hintergrund: berechnet.backgroundColor, radius: berechnet.borderTopLeftRadius };
    });

    expect(stil.hintergrund).not.toBe("rgb(255, 255, 255)");
    expect(stil.hintergrund).not.toBe("rgba(0, 0, 0, 0)");
    expect(parseFloat(stil.radius)).toBeGreaterThan(0);
  });

  test("verwendet die freigestellte Fassung", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".aufmacher-logo img")).toHaveAttribute("src", /logo-full-frei/);
  });
});
