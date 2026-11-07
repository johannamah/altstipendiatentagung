import { expect, test } from "@playwright/test";

/**
 * ADR-0002 verspricht Offline-Nutzung der Programminhalte, Annahme A5 sagt, dass
 * das Netz in der Tagungsstaette unzuverlaessig ist. Beides ist erst eingeloest,
 * wenn im echten Browser tatsaechlich etwas erscheint - eine korrekte
 * Adressliste (tests/unit/serviceworker.test.ts) genuegt dafuer nicht.
 *
 * Die Tests laufen bewusst seriell und in eigenem Kontext: Ein Service Worker
 * ist Zustand, der zwischen Aufrufen bestehen bleibt.
 */

test.describe.configure({ mode: "serial" });

/** Wartet, bis der Worker aktiv ist UND seinen Vorabspeicher gefuellt hat. */
async function workerBereit(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;

      const registrierung = await navigator.serviceWorker.ready;
      if (!registrierung.active) return false;

      /* Die Installation laeuft nebenlaeufig: "aktiv" heisst noch nicht, dass
         das Programm schon im Speicher liegt. Ohne diese zweite Bedingung
         wuerde der Test je nach Laufzeit mal rot und mal gruen. */
      const namen = await caches.keys();
      for (const name of namen) {
        const speicher = await caches.open(name);
        if (await speicher.match("/programm/")) return true;
      }

      return false;
    },
    undefined,
    { timeout: 20_000 },
  );
}

test("liefert besuchte und unbesuchte Seiten auch ohne Netz aus", async ({ page, context }) => {
  await page.goto("/");
  await workerBereit(page);

  await context.setOffline(true);

  try {
    /* /programm/ wurde in diesem Test NIE aufgerufen - es kommt allein aus dem
       Vorabspeicher. Genau das ist der Fall, der vor Ort zaehlt: Wer die App
       zu Hause einmal geoeffnet hat, kommt im Funkloch trotzdem ans Programm. */
    await page.goto("/programm/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Bereiche" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

/**
 * Produktprinzip 1 und die ausdrueckliche Warnung in ADR-0002: Ein Worker, der
 * Seiten bevorzugt aus dem Speicher beantwortet, zeigt am Tagungsmorgen das
 * Programm von gestern. Geprueft wird deshalb, dass eine erreichbare Seite
 * wirklich vom Server kommt.
 */
test("bevorzugt bei bestehender Verbindung das Netz", async ({ page }) => {
  await page.goto("/");
  await workerBereit(page);

  let vomServer = false;
  page.on("request", (anfrage) => {
    if (anfrage.isNavigationRequest() && anfrage.url().endsWith("/programm/")) vomServer = true;
  });

  await page.goto("/programm/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  expect(vomServer, "Seitenaufruf wurde nicht ans Netz weitergereicht").toBe(true);
});
