import { expect, test } from "@playwright/test";

/**
 * Der illustrierte Stadtplan auf "Orte & Anfahrt". Barrierefreiheit (axe) und
 * die 320-px-Breite prueft ansichten.spec.ts bereits fuer alle Bereiche.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/orte");
});

test("zeigt den illustrierten Stadtplan", async ({ page }) => {
  const plan = page.getByRole("img", { name: /^Illustrierter Stadtplan/ });

  await expect(plan).toBeVisible();
  // Geladen, nicht nur vorhanden: Ein falscher Bildpfad fiele sonst nicht auf.
  await expect
    .poll(() => plan.evaluate((bild: HTMLImageElement) => bild.naturalWidth))
    .toBeGreaterThan(0);
});

/**
 * Auf dem Smartphone sind die Beschriftungen ohne Vergroessern kaum lesbar.
 * Ein neuer Tab statt derselben Seite: In der installierten App gaebe es
 * sonst keinen Weg zurueck.
 */
test("öffnet den Stadtplan in voller Größe in einem neuen Tab", async ({ page, request }) => {
  const link = page.getByRole("link", { name: /Stadtplan in voller Größe öffnen/ });

  await expect(link).toHaveAttribute("target", "_blank");
  const antwort = await request.get((await link.getAttribute("href")) ?? "");
  expect(antwort.ok()).toBe(true);
  expect(antwort.headers()["content-type"]).toMatch(/^image\//);
});

test("nennt die Wege aus dem Plan auch als Text", async ({ page }) => {
  await page.getByText("Wege ab dem Mariano-Josephinum").click();

  const wege = page.getByRole("list", { name: "Wege ab dem Mariano-Josephinum" });
  await expect(wege.getByRole("listitem")).toHaveCount(10);
  await expect(
    wege.getByRole("listitem").filter({ hasText: "Dom Mariä Himmelfahrt" }),
  ).toContainText("Domhof 3: ca. 3 Min. zu Fuß");
  await expect(wege.getByRole("listitem").filter({ hasText: "Halle39" })).toContainText(
    "Transfer ab dem Transferpunkt am Mariano-Josephinum",
  );
});

test("zeigt keinen Platzhalter mehr anstelle einer Karte", async ({ page }) => {
  await expect(page.getByText(/fehlen noch die Koordinaten/)).toHaveCount(0);
});

/**
 * Entscheidung vom 28.11.2026: Die Exkursionsorte stehen vorerst nicht auf
 * "Orte & Anfahrt" - sie stehen bei den Exkursionen selbst.
 */
test("zeigt die Exkursionsorte vorerst nicht", async ({ page }) => {
  const gruppen = page.getByRole("heading", { level: 2 });

  await expect(gruppen.filter({ hasText: /^Exkursion/ })).toHaveCount(0);
  await expect(page.getByText("Sprengel Museum Hannover")).toHaveCount(0);
  await expect(page.getByText("Hof Riepl-Bauer")).toHaveCount(0);
  // Tagungsort, Rahmenprogramm und Hotels bleiben.
  await expect(gruppen.filter({ hasText: "Tagungsort" })).toHaveCount(1);
  await expect(page.getByText("Halle39").filter({ visible: true }).first()).toBeVisible();
  await expect(
    page.getByText("Van der Valk Hotel Hildesheim").filter({ visible: true }).first(),
  ).toBeVisible();
});
