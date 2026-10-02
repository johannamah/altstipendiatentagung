import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { erwarteKeinSeitenScroll } from "./hilfen.ts";

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

/**
 * Am Donnerstag laufen Mitgliederversammlung und Partnerprogramm beide von
 * 15:00 bis 17:00 - man muss sich entscheiden. Eine Liste, die beide
 * untereinander zeigt, verschweigt das.
 */
test("weist auch gleichzeitige Hauptprogrammpunkte als Auswahl aus", async ({ page }) => {
  await expect(page.getByText("Gleichzeitig · 2 zur Wahl")).toBeVisible();
});

test("zeigt die aktualisierten Zeiten und Orte aus der Programmvorlage", async ({ page }) => {
  // Die Einfuehrung beginnt jetzt um 13:30 - die Ueberschneidung mit der
  // Begruessung ist damit aufgeloest.
  await expect(page.getByText("13:30–14:30 Uhr")).toBeVisible();
  // Das Weinfest endet um Mitternacht: im Deutschen 24:00, nicht 00:00.
  await expect(page.getByText("20:00–24:00 Uhr")).toBeVisible();
  await expect(page.getByText("deseo Cafe . Restaurant . Bar")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Verabschiedung und Rückreise/ })).toBeVisible();
});

test("kennzeichnet unbestaetigte Punkte als Text, nicht nur farblich", async ({ page }) => {
  await expect(page.getByText("noch nicht bestätigt").first()).toBeVisible();
  await expect(page.getByText("Platzhalter").first()).toBeVisible();
});

/**
 * Der Kern der Aenderung: Zugeklappt beantwortet ein Punkt "wann, was, wo",
 * aufgeklappt kommt alles Weitere dazu.
 */
test("ein Programmpunkt laesst sich aufklappen und zeigt dann mehr", async ({ page }) => {
  const punkt = page.locator('.punkt[data-id="panel-europa-unter-druck"]');

  await expect(punkt).not.toHaveAttribute("open", "");
  // Zeit, Titel und Ortsname sind auch zugeklappt zu sehen.
  await expect(punkt.getByText("10:00–11:30 Uhr")).toBeVisible();
  await expect(punkt.getByRole("heading", { name: /Europa unter Druck/ })).toBeVisible();
  await expect(punkt.getByText("Novotel Hildesheim").first()).toBeVisible();

  await punkt.locator("summary").click();
  await expect(punkt).toHaveAttribute("open", "");
  await expect(punkt.getByRole("button", { name: /Merken/ })).toBeVisible();
});

/**
 * Ohne Beschreibung soll dastehen, dass keine vorliegt - eine leere Flaeche
 * laesst offen, ob der Text fehlt oder die Anwendung kaputt ist (Regel 23).
 */
test("benennt eine fehlende Beschreibung", async ({ page }) => {
  const punkt = page.locator('.punkt[data-id="kaffeepause-donnerstag"]');
  await punkt.locator("summary").click();

  await expect(punkt.getByText("Zu diesem Punkt liegt noch keine Beschreibung vor.")).toBeVisible();
});

test("die Titel bleiben Ueberschriften, auch zugeklappt", async ({ page }) => {
  // Ohne das verlieren Screenreader die Ueberschriftennavigation im Programm.
  await expect(page.getByRole("heading", { name: "Niedersächsischer Abend" })).toBeVisible();
});

/**
 * Am Freitag stehen sieben Exkursionen zur Wahl. Eine schlichte Liste liest
 * sich wie eine Abfolge - deshalb Einrueckung, Verbindungslinie UND ein Satz,
 * der es ausspricht.
 */
test("gleichzeitige Punkte sind eingerueckt und als Auswahl benannt", async ({ page }) => {
  await expect(page.getByText(/Diese Punkte laufen parallel/).first()).toBeVisible();

  const eingerueckt = page.locator("#tag-2027-05-07 .eintrag[data-gruppe]");
  await expect(eingerueckt).toHaveCount(7);

  const innen = await eingerueckt.first().evaluate((el) => getComputedStyle(el).borderLeftWidth);
  expect(parseFloat(innen)).toBeGreaterThan(0);
});

test("eine Gruppe laesst sich einklappen und wieder ausklappen", async ({ page }) => {
  const umschalter = page.locator('[data-gruppe="2027-05-07-2"]').first();
  await expect(umschalter).toHaveAttribute("aria-expanded", "true");

  await umschalter.click();
  await expect(umschalter).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('.eintrag[data-gruppe="2027-05-07-2"]').first()).toBeHidden();

  await umschalter.click();
  await expect(page.locator('.eintrag[data-gruppe="2027-05-07-2"]').first()).toBeVisible();
});

test("zeigt Punkte ohne Termin, statt sie zu verschweigen", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Noch ohne Termin" })).toBeVisible();
  // Die Kaffeepause am Samstag hat weiterhin keine Uhrzeit.
  await expect(page.getByRole("heading", { name: "Kaffeepause" }).last()).toBeVisible();
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
  await erwarteKeinSeitenScroll(page);
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
