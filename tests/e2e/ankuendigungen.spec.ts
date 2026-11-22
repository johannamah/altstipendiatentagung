import { expect, test, type Page } from "@playwright/test";

/**
 * Supabase wird nie wirklich angefragt (AGENTS.md: externe Dienste in Tests
 * kontrolliert ersetzen). Die Adresse kommt aus playwright.config.ts und ist
 * absichtlich keine echte.
 */
const SUPABASE = "https://supabase.test/rest/v1/ankuendigungen**";

const EINTRAEGE = [
  {
    id: "alt",
    titel: "Hotelkontingent freigeschaltet",
    text: "Das Kontingent ist ab sofort buchbar.",
    gewicht: "info",
    veroeffentlicht_am: "2026-11-01T09:00:00Z",
  },
  {
    id: "neu",
    titel: "Raumänderung am Freitag",
    text: "Der Vortrag findet im Saal 2 statt.",
    gewicht: "wichtig",
    veroeffentlicht_am: "2026-11-21T09:00:00Z",
  },
];

async function liefere(page: Page, eintraege: unknown[]) {
  await page.route(SUPABASE, (route) => route.fulfill({ json: eintraege }));
}

test("zeigt die Ankündigungen aus der Datenbank, neueste zuerst", async ({ page }) => {
  await liefere(page, EINTRAEGE);
  await page.goto("/ankuendigungen");

  const titel = page.getByRole("heading", { level: 2 });
  await expect(titel).toHaveText(["Raumänderung am Freitag", "Hotelkontingent freigeschaltet"]);
  await expect(page.getByText("Wichtig", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Der Vortrag findet im Saal 2 statt.")).toBeVisible();
});

test("fragt Supabase mit dem veröffentlichbaren Schlüssel an", async ({ page }) => {
  const anfrage = page.waitForRequest(SUPABASE);
  await liefere(page, []);
  await page.goto("/ankuendigungen");

  expect((await anfrage).headers()["apikey"]).toBe("sb_publishable_test");
});

test("sagt ehrlich, wenn es keine Ankündigungen gibt", async ({ page }) => {
  await liefere(page, []);
  await page.goto("/ankuendigungen");

  await expect(page.getByText(/Derzeit gibt es keine Ankündigungen/)).toBeVisible();
});

test("meldet einen Ladefehler und lädt auf Wunsch erneut", async ({ page }) => {
  let versuche = 0;
  await page.route(SUPABASE, (route) => {
    versuche += 1;
    return versuche === 1
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: EINTRAEGE });
  });
  await page.goto("/ankuendigungen");

  await expect(page.getByText(/konnten gerade nicht geladen werden/)).toBeVisible();
  await page.getByRole("button", { name: "Erneut versuchen" }).click();

  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
});

test("zeigt ohne Verbindung die zuletzt geladenen Ankündigungen mit ihrem Stand", async ({
  page,
}) => {
  await liefere(page, EINTRAEGE);
  await page.goto("/ankuendigungen");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);

  await page.unroute(SUPABASE);
  await page.route(SUPABASE, (route) => route.abort("internetdisconnected"));
  await page.reload();

  await expect(page.getByText(/Keine Verbindung – angezeigt wird der Stand vom/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
});
