import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/programm");
});

test("zeigt alle fuenf Tagungstage in zeitlicher Reihenfolge", async ({ page }) => {
  const ueberschriften = page.getByRole("heading", { level: 2 });

  await expect(ueberschriften.nth(0)).toContainText("Mittwoch, 5. Mai 2027");
  await expect(ueberschriften.nth(1)).toContainText("Donnerstag, 6. Mai 2027");
  await expect(ueberschriften.nth(2)).toContainText("Freitag, 7. Mai 2027");
  await expect(ueberschriften.nth(3)).toContainText("Samstag, 8. Mai 2027");
  await expect(ueberschriften.nth(4)).toContainText("Sonntag, 9. Mai 2027");
});

/**
 * Der Kern von Issue #8: Die sieben Exkursionen am Freitag sind Alternativen
 * zueinander. Eine schlichte Liste liest sich wie eine Abfolge - dann meint man,
 * man koenne alle sieben mitnehmen.
 */
test("weist gleichzeitige Exkursionen als Auswahl aus", async ({ page }) => {
  await expect(page.getByText("Exkursionen · 7 zur Wahl")).toBeVisible();
  await expect(page.getByText("Parallele Vorträge · 3 zur Wahl").first()).toBeVisible();
});

test("kennzeichnet unbestaetigte Punkte als Text, nicht nur farblich", async ({ page }) => {
  await expect(page.getByText("noch nicht bestätigt").first()).toBeVisible();
  await expect(page.getByText("Platzhalter").first()).toBeVisible();
});

test("zeigt Punkte ohne Termin, statt sie zu verschweigen", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Noch ohne Termin" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Partnerprogramm" })).toBeVisible();
});

test("weist einen Punkt ueber Mitternacht als solchen aus", async ({ page }) => {
  // Festabend am Samstag, 19:00 bis 03:00 Uhr.
  await expect(page.getByText("19:00–03:00 Uhr (am Folgetag)").first()).toBeVisible();
});

test("die Tagesauswahl springt zum gewaehlten Tag", async ({ page }) => {
  const auswahl = page.getByRole("navigation", { name: "Tage der Tagung" });
  await auswahl.getByRole("link", { name: "Fr, 7.5." }).click();

  await expect(page).toHaveURL(/#tag-2027-05-07$/);
  await expect(page.getByRole("heading", { name: "Freitag, 7. Mai 2027" })).toBeInViewport();
});

test("ist von der Startseite aus erreichbar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Programm/i }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Programm");
});

test("laeuft ab 320px Breite ohne horizontales Scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  const ueberbreite = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(ueberbreite).toBeLessThanOrEqual(0);
});

for (const darstellung of ["hell", "dunkel"] as const) {
  test(`ist in der ${darstellung}en Darstellung frei von axe-Befunden`, async ({ page }) => {
    await page.evaluate((wert) => {
      document.documentElement.dataset.theme = wert;
    }, darstellung);

    const ergebnis = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(ergebnis.violations).toEqual([]);
  });
}
