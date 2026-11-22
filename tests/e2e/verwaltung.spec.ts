import { expect, test, type Page, type Request } from "@playwright/test";

/**
 * Verwaltung der Ankuendigungen. Supabase wird nie wirklich angefragt; die
 * Adresse kommt aus playwright.config.ts. Ob die Datenbank Schreibzugriffe
 * wirklich nur Admins erlaubt, pruefen die Tests in tests/unit/datenbank.test.ts
 * gegen ein echtes Postgres - hier geht es um die Oberflaeche.
 */
const TOKEN = "https://supabase.test/auth/v1/token**";
const ADMIN_PRUEFUNG = "https://supabase.test/rest/v1/rpc/ist_ankuendigungen_admin";
const TABELLE = "https://supabase.test/rest/v1/ankuendigungen**";

const SITZUNG = {
  access_token: "zugriff",
  refresh_token: "erneuerung",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "admin-1", email: "admin@example.org" },
};

const EINTRAG = {
  id: "a1",
  titel: "Raumänderung am Freitag",
  text: "Der Vortrag findet im Saal 2 statt.",
  gewicht: "info",
  sichtbar: true,
  veroeffentlicht_am: "2026-11-21T09:00:00Z",
};

async function anmelden(page: Page, { admin = true, eintraege = [EINTRAG] } = {}) {
  await page.route(TOKEN, (route) => route.fulfill({ json: SITZUNG }));
  await page.route(ADMIN_PRUEFUNG, (route) => route.fulfill({ json: admin }));
  await page.route(TABELLE, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: eintraege })
      : route.fulfill({ status: 204, body: "" }),
  );

  await page.goto("/verwaltung");
  await page.getByLabel("E-Mail-Adresse").fill("admin@example.org");
  await page.getByLabel("Passwort").fill("ein-langes-passwort");
  await page.getByRole("button", { name: "Anmelden" }).click();
}

/** Wartet auf den naechsten schreibenden Aufruf an die Tabelle. */
const schreibzugriff = (page: Page) =>
  page.waitForRequest(
    (r: Request) => r.url().includes("/rest/v1/ankuendigungen") && r.method() !== "GET",
  );

test("wird von Suchmaschinen nicht erfasst", async ({ page }) => {
  await page.goto("/verwaltung");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("meldet falsche Zugangsdaten verständlich", async ({ page }) => {
  await page.route(TOKEN, (route) =>
    route.fulfill({ status: 400, json: { error: "invalid_grant" } }),
  );
  await page.goto("/verwaltung");

  await page.getByLabel("E-Mail-Adresse").fill("admin@example.org");
  await page.getByLabel("Passwort").fill("falsch");
  await page.getByRole("button", { name: "Anmelden" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "E-Mail-Adresse oder Passwort stimmen nicht.",
  );
});

test("ein Konto ohne Admin-Recht bekommt keine Verwaltung", async ({ page }) => {
  await anmelden(page, { admin: false });

  await expect(page.getByText("Dieses Konto darf keine Ankündigungen verwalten.")).toBeVisible();
  await expect(page.getByLabel("Titel")).toBeHidden();
});

test("ein Admin legt eine Ankündigung an", async ({ page }) => {
  await anmelden(page, { eintraege: [] });

  await page.getByLabel("Titel").fill("Bus fährt später");
  await page.getByLabel("Text").fill("Der Transfer zur Exkursion startet um 12:45 Uhr.");
  await page.getByLabel("Als wichtig markieren").check();
  await page.getByLabel("Sofort sichtbar").check();

  const anfrage = schreibzugriff(page);
  await page.getByRole("button", { name: "Speichern" }).click();

  const gesendet = await anfrage;
  expect(gesendet.method()).toBe("POST");
  expect(gesendet.headers()["authorization"]).toBe("Bearer zugriff");
  expect(gesendet.postDataJSON()).toEqual({
    titel: "Bus fährt später",
    text: "Der Transfer zur Exkursion startet um 12:45 Uhr.",
    gewicht: "wichtig",
    sichtbar: true,
  });
  await expect(page.getByText("Gespeichert.")).toBeVisible();
});

test("prüft Pflichtfelder, bevor etwas gesendet wird", async ({ page }) => {
  await anmelden(page, { eintraege: [] });
  let gesendet = false;
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/ankuendigungen") && r.method() === "POST") gesendet = true;
  });

  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("Bitte einen Titel eingeben.")).toBeVisible();
  await expect(page.getByLabel("Titel")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Titel")).toBeFocused();
  expect(gesendet).toBe(false);
});

test("ein Admin verbirgt und löscht eine Ankündigung", async ({ page }) => {
  await anmelden(page);
  const eintrag = page.getByRole("listitem").filter({ hasText: "Raumänderung am Freitag" });
  await expect(eintrag.getByText("sichtbar", { exact: true })).toBeVisible();

  let anfrage = schreibzugriff(page);
  await eintrag.getByRole("button", { name: /Verbergen/ }).click();
  let gesendet = await anfrage;
  expect(gesendet.method()).toBe("PATCH");
  expect(new URL(gesendet.url()).searchParams.get("id")).toBe("eq.a1");
  expect(gesendet.postDataJSON()).toEqual({ sichtbar: false });

  page.once("dialog", (dialog) => dialog.accept());
  anfrage = schreibzugriff(page);
  await eintrag.getByRole("button", { name: /Löschen/ }).click();
  gesendet = await anfrage;
  expect(gesendet.method()).toBe("DELETE");
});

test("ein Admin bearbeitet eine Ankündigung", async ({ page }) => {
  await anmelden(page);

  await page.getByRole("button", { name: /Bearbeiten/ }).click();
  await expect(page.getByLabel("Titel")).toHaveValue("Raumänderung am Freitag");
  await page.getByLabel("Titel").fill("Raumänderung am Freitag: Saal 3");

  const anfrage = schreibzugriff(page);
  await page.getByRole("button", { name: "Speichern" }).click();

  const gesendet = await anfrage;
  expect(gesendet.method()).toBe("PATCH");
  expect(new URL(gesendet.url()).searchParams.get("id")).toBe("eq.a1");
});

test("nach dem Abmelden erscheint wieder die Anmeldung", async ({ page }) => {
  await page.route("https://supabase.test/auth/v1/logout", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await anmelden(page);

  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
});
