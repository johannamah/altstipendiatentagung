import { expect, test } from "@playwright/test";

/* Vercel liefert fuer unbekannte Adressen dist/404.html mit Status 404 aus;
   astro preview verhaelt sich gleich. */
test("eine unbekannte Adresse zeigt die Fehlerseite mit Weg zur Übersicht", async ({ page }) => {
  const antwort = await page.goto("/gibt-es-nicht");

  expect(antwort?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Seite nicht gefunden" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
});
