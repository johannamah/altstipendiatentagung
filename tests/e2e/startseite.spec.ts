import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { BEREICHE } from "../../src/daten/bereiche.ts";

/**
 * Geprueft wird beobachtbares Verhalten, nicht Markup (AGENTS.md).
 * Die Locator sprechen Rollen und sichtbaren Text an, keine CSS-Klassen -
 * so ueberleben die Tests einen Umbau der Darstellung.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("zeigt Titel, Termin und alle Bereiche", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Altstipendiatentagung 2027");
  await expect(page.getByText("5.–9. Mai 2027 · Hildesheim")).toBeVisible();

  const bereiche = page.getByRole("navigation", { name: "Bereiche" });

  for (const bereich of BEREICHE) {
    const kachel = bereiche.getByRole("link", { name: new RegExp(bereich.titel, "i") });
    await expect(kachel, `Bereich fehlt: ${bereich.titel}`).toBeVisible();
    await expect(kachel).toHaveAttribute("href", `/${bereich.slug}`);
  }
});

/**
 * Regel 41. Im Einzeldatei-Entwurf fehlte der sichtbare Fokus vollstaendig -
 * dieser Test sorgt dafuer, dass er nicht wieder verloren geht.
 */
test("jede Kachel ist per Tastatur erreichbar und zeigt sichtbaren Fokus", async ({ page }) => {
  const ersteKachel = page.getByRole("link", { name: new RegExp(BEREICHE[0]!.titel, "i") });

  await ersteKachel.focus();
  await expect(ersteKachel).toBeFocused();

  const umriss = await ersteKachel.evaluate((element) => {
    const stil = getComputedStyle(element);
    return { breite: stil.outlineWidth, stil: stil.outlineStyle };
  });

  expect(umriss.stil, "Der Fokus muss sichtbar umrandet sein").not.toBe("none");
  expect(parseFloat(umriss.breite)).toBeGreaterThanOrEqual(2);
});

test("der Sprunglink fuehrt zum Inhalt und wird bei Tastaturfokus sichtbar", async ({ page }) => {
  const sprunglink = page.getByRole("link", { name: "Direkt zum Inhalt" });

  await sprunglink.focus();
  await expect(sprunglink).toBeInViewport();
  await expect(sprunglink).toHaveAttribute("href", "#inhalt");
});

/** Regel 10: keine horizontale Scrollleiste, in keiner Breite ab 320px. */
test("laeuft ab 320px Breite ohne horizontales Scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  const ueberbreite = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(ueberbreite, "Die Seite ist breiter als das Fenster").toBeLessThanOrEqual(0);
});

test("der Umschalter wechselt die Darstellung und merkt sie sich", async ({ page }) => {
  const umschalter = page.getByRole("button", { name: /Darstellung/ });

  // Ausgangspunkt: Systemeinstellung, also kein gesetztes Attribut.
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);

  await umschalter.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hell");

  await umschalter.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dunkel");

  // Die Wahl muss einen Neuaufbau der Seite ueberstehen.
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dunkel");

  // Und wieder zurueck zur Systemeinstellung.
  await umschalter.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

/**
 * axe findet nur einen Teil der echten Probleme und ersetzt keine manuelle
 * Pruefung mit Tastatur und Screenreader (Regel 44). Es haelt aber die
 * Faelle fest, die sich automatisch pruefen lassen - in beiden Darstellungen.
 */
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
