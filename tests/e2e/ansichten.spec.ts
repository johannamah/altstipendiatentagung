import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { BEREICHE } from "../../src/daten/bereiche.ts";

/**
 * Der Fehler, den diese Tests verhindern sollen: Acht Kacheln der Startseite
 * fuehrten ins Leere. Geprueft wird deshalb JEDE Kachel, nicht eine Auswahl.
 */

test.describe("alle Bereiche sind erreichbar", () => {
  for (const bereich of BEREICHE) {
    test(`${bereich.titel} öffnet sich von der Startseite aus`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: new RegExp(bereich.titel, "i") }).click();

      await expect(page).toHaveURL(new RegExp(`/${bereich.slug}/?$`));
      // Jede Seite hat genau eine Hauptüberschrift.
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

test.describe("Zurück zur Übersicht", () => {
  for (const bereich of BEREICHE) {
    test(`${bereich.titel} hat einen Weg zurück`, async ({ page }) => {
      await page.goto(`/${bereich.slug}`);

      const zurueck = page.getByRole("link", { name: "Übersicht" });
      await expect(zurueck).toBeVisible();

      await zurueck.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Altstipendiatentagung 2027",
      );
    });
  }

  /**
   * Auf der Startseite waere ein Zurueck-Knopf sinnlos - er fuehrte auf die
   * Seite, auf der man schon steht.
   */
  test("die Startseite zeigt keinen Zurück-Knopf", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Übersicht" })).toHaveCount(0);
  });

  /**
   * Der Weg zurueck ist ein echter Link, kein history.back(): Wer die Seite
   * ueber einen geteilten Link geoeffnet hat, hat keine Vorgeschichte.
   */
  test("funktioniert auch ohne Vorgeschichte", async ({ page }) => {
    await page.goto("/unterbringung");
    await page.getByRole("link", { name: "Übersicht" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Altstipendiatentagung");
  });
});

test.describe("Inhalte aus dem ursprünglichen Entwurf", () => {
  test("Unterbringung zeigt Kontingent, Stichwort und Preise", async ({ page }) => {
    await page.goto("/unterbringung");

    await expect(page.getByRole("heading", { name: "Novotel Hildesheim" })).toBeVisible();
    await expect(page.getByText("KAS - Holstein")).toBeVisible();
    await expect(page.getByText("89,00 € / Nacht")).toBeVisible();
    await expect(page.getByRole("heading", { name: "B&B Hotel Hildesheim" })).toBeVisible();
  });

  test("Anmeldung zeigt alle neun Exkursionen mit Platzzahl", async ({ page }) => {
    await page.goto("/anmeldung");

    await expect(page.locator(".exkursionen > li")).toHaveCount(9);
    await expect(page.getByText("50 Plätze").first()).toBeVisible();
  });

  /**
   * Der Entwurf hatte ein Formular im Testmodus: Eingaben nur im
   * Arbeitsspeicher, danach "Anmeldung erfolgreich". Oeffentlich erreichbar
   * waere das eine Falle - deshalb steht dort jetzt der Stand statt des
   * Formulars.
   */
  test("Anmeldung nimmt keine personenbezogenen Daten entgegen", async ({ page }) => {
    await page.goto("/anmeldung");

    await expect(page.getByText("Die Anmeldung ist noch nicht geöffnet.")).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.locator("input[type='email'], input[type='text']")).toHaveCount(0);
  });

  test("Kontakt zeigt das Orga-Team und den Tagungsort", async ({ page }) => {
    await page.goto("/kontakt");

    await expect(page.locator(".personen > li")).toHaveCount(8);
    await expect(page.getByRole("heading", { name: "Tagungsort" })).toBeVisible();
    await expect(page.getByText("Bahnhofsallee 38")).toBeVisible();
  });

  test("FAQ lässt sich ohne JavaScript auf- und zuklappen", async ({ page }) => {
    await page.goto("/faq");

    const frage = page.getByRole("group").filter({ hasText: "Wie melde ich mich an?" });
    await expect(frage).not.toHaveAttribute("open", "");

    await page.getByText("Wie melde ich mich an?").click();
    await expect(frage).toHaveAttribute("open", "");
  });

  test("Hildesheim zeigt Geschichte, Sehenswürdigkeiten und Restaurants", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.getByRole("heading", { name: /Geschichte Hildesheims/ })).toBeVisible();
    await expect(page.getByText("Tausendjährige Rosenstock")).toBeVisible();
    await expect(page.getByText("Knochenhaueramtshaus").first()).toBeVisible();
  });

  test("Ankündigungen zeigt die Einträge, neueste zuerst", async ({ page }) => {
    await page.goto("/ankuendigungen");

    await expect(page.locator(".liste > li")).toHaveCount(2);
  });

  test("Begrüßung weist den Text als Platzhalter aus", async ({ page }) => {
    await page.goto("/begruessung");

    await expect(page.getByText(/Platzhaltertext/)).toBeVisible();
    await expect(page.getByText("Demokratie leben – Europa gestalten")).toBeVisible();
  });

  /**
   * Solange kein Album verknuepft ist, darf dort kein Knopf stehen, der ins
   * Leere fuehrt - dieselbe Regel wie bei den Bedienelementen im Programm.
   */
  test("Fotos bietet keinen Link ins Leere", async ({ page }) => {
    await page.goto("/fotos");

    await expect(page.getByRole("link", { name: /Fotos ansehen/ })).toHaveCount(0);
    await expect(page.getByText(/noch kein Fotoalbum verknüpft/)).toBeVisible();
  });
});

test.describe("Barrierefreiheit aller Bereiche", () => {
  for (const bereich of BEREICHE) {
    for (const darstellung of ["hell", "dunkel"] as const) {
      test(`${bereich.titel} ist in der ${darstellung}en Darstellung frei von axe-Befunden`, async ({
        page,
      }) => {
        await page.goto(`/${bereich.slug}`);
        await page.evaluate((wert) => {
          document.documentElement.dataset.theme = wert;
        }, darstellung);

        const ergebnis = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();

        expect(ergebnis.violations).toEqual([]);
      });
    }
  }
});

test.describe("schmale Geräte", () => {
  for (const bereich of BEREICHE) {
    test(`${bereich.titel} läuft ab 320px ohne horizontales Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(`/${bereich.slug}`);

      await page.evaluate(() => window.scrollTo({ left: 9999, behavior: "instant" }));
      expect(await page.evaluate(() => window.scrollX)).toBe(0);
    });
  }
});
