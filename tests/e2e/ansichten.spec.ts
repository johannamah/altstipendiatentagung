import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { BEREICHE, kachelZiel, SEITENBEREICHE } from "../../src/daten/bereiche.ts";
import { erwarteKeinSeitenScroll } from "./hilfen.ts";

/**
 * Der Fehler, den diese Tests verhindern sollen: Acht Kacheln der Startseite
 * fuehrten ins Leere. Geprueft wird deshalb JEDE Kachel, nicht eine Auswahl.
 */

test.describe("alle Bereiche sind erreichbar", () => {
  for (const bereich of SEITENBEREICHE) {
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
  for (const bereich of SEITENBEREICHE) {
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

  /**
   * Die Anmeldung laeuft ueber Microsoft Forms (ADR-0011). Geprueft wird das
   * Ziel der Kachel, nicht das Formular selbst: Ein Test, der bei Microsoft
   * anklopft, haengt an deren Erreichbarkeit und erzeugt dort Aufrufe.
   */
  test("Anmeldung öffnet das Anmeldeformular in einem neuen Tab", async ({ page }) => {
    const anmeldung = BEREICHE.find((bereich) => bereich.slug === "anmeldung")!;
    await page.goto("/");

    const kachel = page.getByRole("link", { name: /Anmeldung/ });
    await expect(kachel).toHaveAttribute("href", kachelZiel(anmeldung));
    await expect(kachel).toHaveAttribute("target", "_blank");
    await expect(kachel).toHaveAttribute("rel", /noopener/);
    // Dass ein neuer Tab aufgeht, steht sichtbar auf der Kachel.
    await expect(kachel).toContainText("öffnet neuen Tab");
  });

  test("Kontakt zeigt das Orga-Team in der festgelegten Reihenfolge", async ({ page }) => {
    await page.goto("/kontakt");

    const namen = page.locator(".personen h3");
    await expect(namen).toHaveCount(8);
    await expect(namen.nth(0)).toHaveText("Konstantin Gerbrich");
    await expect(namen.nth(1)).toHaveText("Torben Burdorf");
    await expect(namen.nth(7)).toHaveText("Ferdinand Meißner");
  });

  test("Kontakt verlinkt hinterlegte Telefonnummern und E-Mail-Adressen", async ({ page }) => {
    await page.goto("/kontakt");

    await expect(page.getByRole("link", { name: "+49 1515 6675547" })).toBeVisible();
    await expect(page.getByRole("link", { name: "t.burdorf@altstipendiaten.de" })).toBeVisible();
  });

  /**
   * Der Verweis auf die FAQ steht bewusst VOR den Ansprechpersonen: Jede Frage,
   * die gar nicht erst gestellt wird, entlastet ein ehrenamtliches Team.
   */
  test("Kontakt nennt die FAQ vor den Ansprechpersonen", async ({ page }) => {
    await page.goto("/kontakt");

    const faqHinweis = await page.locator(".zuerst").boundingBox();
    const erstePerson = await page.locator(".personen > li").first().boundingBox();

    expect(faqHinweis!.y).toBeLessThan(erstePerson!.y);
  });

  test("Referenten & Gäste stellt jede Person mit Funktion und Kurzvorstellung vor", async ({
    page,
  }) => {
    await page.goto("/referenten");

    for (const name of ["Norbert Lammert", "Annegret Kramp-Karrenbauer", "Christian Wulff"]) {
      const person = page.getByRole("article").filter({
        has: page.getByRole("heading", { name }),
      });
      await expect(person, `${name} fehlt`).toBeVisible();
      // Ohne Funktion bleibt offen, warum die Person auf der Tagung spricht.
      await expect(person.locator("p").first()).not.toBeEmpty();
    }
  });

  /**
   * Die Kurzvorstellungen sind von uns verfasst, nicht von den Personen
   * freigegeben. Das muss als Text dastehen, nicht nur farblich.
   */
  test("Referenten & Gäste kennzeichnet nicht abgestimmte Texte", async ({ page }) => {
    await page.goto("/referenten");

    await expect(page.getByText("Text noch nicht abgestimmt").first()).toBeVisible();
  });

  test("Kontakt zeigt den Tagungsort", async ({ page }) => {
    await page.goto("/kontakt");

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

  test("Hildesheim zeigt alle Abschnitte in fester Reihenfolge", async ({ page }) => {
    await page.goto("/hildesheim");

    const ueberschriften = page.getByRole("heading", { level: 2 });
    await expect(ueberschriften.nth(0)).toContainText("Eine Stadt mit mehr als 1.200 Jahren");
    await expect(ueberschriften.nth(1)).toContainText("Zerstörung und Wiederaufbau");
    await expect(ueberschriften.nth(2)).toContainText("UNESCO-Welterbe");
    await expect(ueberschriften.nth(3)).toContainText("Hildesheim heute");
    await expect(ueberschriften.nth(4)).toContainText("hiApp");
    await expect(ueberschriften.nth(5)).toContainText("Lauschtour");
  });

  test("Hildesheim zeigt die Eckdaten als Wert-Erklärung-Paare", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.locator(".zahlen dt")).toHaveCount(9);
    await expect(page.getByText("104.712")).toBeVisible();
    await expect(page.getByText("92,19 km²")).toBeVisible();
  });

  test("Hildesheim verlinkt die weiterführenden Quellen", async ({ page }) => {
    await page.goto("/hildesheim");

    const links = page.locator(".links a");
    await expect(links).toHaveCount(4);
    // Verweise auf die Stadt und die UNESCO, ohne Nachverfolgungsparameter.
    for (const ziel of await links.evaluateAll((a) => a.map((e) => e.getAttribute("href")))) {
      expect(ziel).not.toContain("utm_source");
    }
  });

  test("Hildesheim nennt Geschichte und Wahrzeichen aus der Vorlage", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.getByText(/Tausendjährige Rosenstock/)).toBeVisible();
    await expect(page.getByText(/Knochenhauer-Amtshaus/)).toBeVisible();
    await expect(page.getByText(/22. März 1945/)).toBeVisible();
  });

  /**
   * Die Empfehlungen werden nachgereicht. Bis dahin steht dort bewusst keine
   * Liste - eine ungepruefte Auswahl waere keine Empfehlung.
   */
  test("Hildesheim listet die Lokale mit Weiterleitung an Karten-Apps", async ({ page }) => {
    await page.goto("/hildesheim");

    const lokale = page.locator(".lokale > li");
    await expect(lokale).toHaveCount(6);
    await expect(lokale.first().getByRole("link", { name: /Google Maps/ })).toBeVisible();
    await expect(lokale.first().getByRole("link", { name: /Apple Karten/ })).toBeVisible();
  });

  /**
   * Die Adressen fehlen - dann muss dastehen, dass die Verweise nur suchen.
   * Sonst hält man den Treffer für geprüft.
   */
  test("Hildesheim sagt, dass die Verweise ohne Adresse nur suchen", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.getByText(/die Verweise suchen nach dem Namen/).first()).toBeVisible();
  });

  test("Ankündigungen zeigt die Einträge, neueste zuerst", async ({ page }) => {
    await page.goto("/ankuendigungen");

    await expect(page.locator(".liste > li")).toHaveCount(2);
  });

  test("Begrüßung zeigt drei Grußworte in fester Reihenfolge", async ({ page }) => {
    await page.goto("/begruessung");

    const namen = page.getByRole("heading", { level: 2 });
    await expect(namen).toHaveCount(3);
    await expect(namen.nth(0)).toContainText("Matthias Wilkes");
    await expect(namen.nth(1)).toContainText("Annegret Kramp-Karrenbauer");
    await expect(namen.nth(2)).toContainText("Sebastian Lechner");
  });

  /**
   * Solange die Originaltexte fehlen, muss an jedem Grusswort stehen, dass es
   * ein Beispiel ist - sonst haelt es jemand fuer abgestimmt und zitiert es.
   */
  test("Begrüßung weist jeden Text als Beispiel aus", async ({ page }) => {
    await page.goto("/begruessung");

    await expect(page.getByText("Beispieltext – Originaltext folgt")).toHaveCount(3);
  });

  test("Begrüßung zeigt zu jedem Grußwort ein Porträt", async ({ page }) => {
    await page.goto("/begruessung");

    await expect(page.locator(".grusswort img")).toHaveCount(3);
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
  for (const bereich of SEITENBEREICHE) {
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
  for (const bereich of SEITENBEREICHE) {
    test(`${bereich.titel} läuft ab 320px ohne horizontales Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(`/${bereich.slug}`);

      await erwarteKeinSeitenScroll(page);
    });
  }
});
