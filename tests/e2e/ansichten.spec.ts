import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { SEITENBEREICHE } from "../../src/daten/bereiche.ts";
import { erwarteKeinSeitenScroll } from "./hilfen.ts";

/**
 * Der Fehler, den diese Tests verhindern sollen: Acht Kacheln der Startseite
 * fuehrten ins Leere. Geprueft wird deshalb JEDE Kachel, nicht eine Auswahl.
 */

test.describe("alle Bereiche sind erreichbar", () => {
  for (const bereich of SEITENBEREICHE) {
    test(`${bereich.titel} öffnet sich von der Startseite aus`, async ({ page }) => {
      await page.goto("/");
      // Nur im Inhalt: Das Logo in der Kopfleiste heisst "Jahrestagung 2027 Hildesheim".
      await page
        .getByRole("main")
        .getByRole("link", { name: new RegExp(bereich.titel, "i") })
        .click();

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
    // exact: Die Kachel "Orte & Anfahrt" nennt eine "Übersichtskarte".
    await expect(page.getByRole("link", { name: "Übersicht", exact: true })).toHaveCount(0);
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
  test("Unterbringung zeigt Kontingente, Stichwort, Preise und Buchungslinks", async ({ page }) => {
    await page.goto("/unterbringung");

    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "B&B Hotel Hildesheim",
      "HeyLou Hotel Hildesheim",
      "Schlafladen Hildesheim",
      "Hotel Bürgermeisterkapelle Hildesheim",
      "Van der Valk Hotel Hildesheim",
    ]);
    await expect(
      page.getByText("„Abrufkontingent, Stichwort: Konrad-Adenauer-Stiftung“").first(),
    ).toBeVisible();
    await expect(page.getByText("77,68 € / Nacht")).toBeVisible();
    // Für Teilnehmende ohne Belang: keine reservierten Zimmerzahlen, kein Verfallsdatum.
    await expect(page.getByRole("columnheader", { name: "Reserviert" })).toHaveCount(0);
    await expect(page.getByText(/verfällt/)).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Buchen\s*:\s*Schlafladen Hildesheim/ }),
    ).toHaveAttribute("href", "https://schlafladen.de/");
  });

  test("Unterbringung zeigt zu jedem Hotel ein Bild", async ({ page }) => {
    await page.goto("/unterbringung");

    for (const hotel of [
      "B&B Hotel",
      "HeyLou",
      "Schlafladen",
      "Bürgermeisterkapelle",
      "Van der Valk",
    ]) {
      await expect(page.getByRole("img", { name: new RegExp(hotel) })).toHaveCount(1);
    }
  });

  /**
   * Die Anmeldung laeuft ueber Microsoft Forms (ADR-0011). Geprueft wird der
   * Verweis, nicht das Formular selbst: Ein Test, der bei Microsoft anklopft,
   * haengt an deren Erreichbarkeit und erzeugt dort Aufrufe.
   */
  test("Anmeldung zeigt die Teilnahmeoptionen und verlinkt das Formular", async ({ page }) => {
    await page.goto("/anmeldung");

    const formular = page.getByRole("link", { name: /Zum Anmeldeformular/ });
    await expect(formular).toHaveAttribute("href", "https://forms.cloud.microsoft/e/sg2gfhJ2uc");
    await expect(formular).toHaveAttribute("target", "_blank");

    const tabelle = page.getByRole("table", { name: "Teilnahmeoptionen" });
    await expect(
      tabelle.getByRole("columnheader", { name: "Mitglied", exact: true }),
    ).toBeVisible();
    await expect(tabelle.getByRole("columnheader", { name: "Nicht-Mitglied" })).toBeVisible();
    for (const option of [
      "Ganze Tagung",
      "Tagung ohne Festabend",
      "Stipendiaten | Stipendiatenbeirat",
      "Chor und Orchester",
    ]) {
      await expect(tabelle.getByText(option).first()).toBeVisible();
    }
  });

  test("Exkursionen stellt alle zehn Angebote mit Übersicht vor", async ({ page }) => {
    await page.goto("/exkursionen");

    const uebersicht = page.getByRole("navigation", { name: "Übersicht der Exkursionen" });
    await expect(uebersicht.getByRole("link")).toHaveCount(10);
    await expect(page.getByRole("article")).toHaveCount(10);

    await uebersicht.getByRole("link", { name: /Willi Hennies/ }).click();
    const hennies = page.getByRole("article").filter({ hasText: "Willi Hennies" });
    await expect(hennies).toBeInViewport();
    await expect(hennies.getByText(/^Was für die einen Abfall ist/)).toBeVisible();
    await expect(
      page.getByText(/Exkursionswünsche gibst du während der Anmeldung an/),
    ).toBeVisible();
  });

  test("Essen & Trinken nennt die Empfehlungen mit Kartenlinks", async ({ page }) => {
    await page.goto("/essen-trinken");

    for (const lokal of ["Zur Scharfen Ecke", "Gasthof Kupferschmiede", "Café Bar Tasca Arcada"]) {
      await expect(page.getByText(lokal).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /Google Maps/ })).toHaveCount(6);
  });

  test("Hildesheim führt die Restaurants nicht mehr doppelt", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.getByText("Zur Scharfen Ecke")).toHaveCount(0);
  });

  test("Die Fußzeile nennt nur den Verein", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/im Aufbau/)).toHaveCount(0);
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

  /** Porträts liegen erst für einen Teil des Orga-Teams vor; die übrigen zeigen Initialen. */
  test("Kontakt zeigt die hinterlegten Porträts", async ({ page }) => {
    await page.goto("/kontakt");

    for (const name of [
      "Konstantin Gerbrich",
      "Torben Burdorf",
      "Pia Gerbrich",
      "Johanna Mahler",
      "Marvin Pawelczyk",
      "Brit Fillies",
      "Sven Lüdiger",
    ]) {
      await expect(page.getByRole("img", { name: `Porträt von ${name}` })).toBeVisible();
    }
    await expect(page.getByRole("img", { name: "Porträt von Ferdinand Meißner" })).toHaveCount(0);
  });

  /**
   * Telefon und E-Mail gibt es nur für die drei Ansprechpersonen. Bei allen
   * anderen steht nichts - kein "noch nicht hinterlegt", das auf etwas warten
   * ließe, das nicht kommt.
   */
  test("Kontakt nennt Telefon und E-Mail nur bei den Ansprechpersonen", async ({ page }) => {
    await page.goto("/kontakt");

    const person = (name: string) =>
      page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
    for (const name of ["Konstantin Gerbrich", "Torben Burdorf", "Pia Gerbrich"]) {
      await expect(person(name).getByRole("link", { name: /@/ }), name).toHaveCount(1);
      await expect(person(name).getByRole("link", { name: /\d{3}/ }), name).toHaveCount(1);
    }
    await expect(person("Johanna Mahler").getByRole("link")).toHaveCount(0);
  });

  test("Kontakt zeigt den Tagungsort", async ({ page }) => {
    await page.goto("/kontakt");

    await expect(page.getByRole("heading", { name: "Tagungsort" })).toBeVisible();
    await expect(page.getByText("Mariano-Josephinum").first()).toBeVisible();
  });

  test("FAQ beginnt mit der Anleitung für den Startbildschirm", async ({ page }) => {
    await page.goto("/faq");

    const fragen = page.locator("summary");
    await expect(fragen.nth(0)).toContainText("Startbildschirm? (Android)");
    await expect(fragen.nth(1)).toContainText("Home-Bildschirm? (iPhone, iPad)");
  });

  test("FAQ verlinkt Anmeldeformular und Orga-Team", async ({ page }) => {
    await page.goto("/faq");

    await page.getByText("Wie melde ich mich an?").click();
    await expect(page.getByRole("link", { name: /Zum Anmeldeformular/ })).toHaveAttribute(
      "href",
      "https://forms.cloud.microsoft/e/sg2gfhJ2uc",
    );

    await page.getByText("An wen wende ich mich bei kurzfristigen Fragen vor Ort?").click();
    await expect(page.getByRole("link", { name: /Orga-Team/ }).first()).toHaveAttribute(
      "href",
      "/kontakt",
    );
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
    await expect(page.getByRole("heading", { level: 2, name: /Essen & Trinken/ })).toHaveCount(0);
  });

  test("Hildesheim zeigt die Eckdaten als Wert-Erklärung-Paare", async ({ page }) => {
    await page.goto("/hildesheim");

    await expect(page.locator(".zahlen dt")).toHaveCount(9);
    await expect(page.getByText("104.712", { exact: true })).toBeVisible();
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
    await expect(page.getByText("Marktplatz mit Knochenhauer-Amtshaus")).toBeVisible();
    await expect(page.getByText(/22. März 1945/)).toBeVisible();
  });

  /** Die Empfehlungen stehen seit dem 28.11.2026 auf einer eigenen Seite. */
  test("Essen & Trinken listet die Lokale mit Weiterleitung an Karten-Apps", async ({ page }) => {
    await page.goto("/essen-trinken");

    const lokale = page.locator(".lokale > li");
    await expect(lokale).toHaveCount(6);
    await expect(lokale.first().getByRole("link", { name: /Google Maps/ })).toBeVisible();
    await expect(lokale.first().getByRole("link", { name: /Apple Karten/ })).toBeVisible();
  });

  /**
   * Die Adressen fehlen - dann muss dastehen, dass die Verweise nur suchen.
   * Sonst hält man den Treffer für geprüft.
   */
  test("Essen & Trinken sagt, dass die Verweise ohne Adresse nur suchen", async ({ page }) => {
    await page.goto("/essen-trinken");

    await expect(page.getByText(/Die Kartenlinks suchen nach dem Namen/).first()).toBeVisible();
  });

  /** Reihenfolge wie im Programmheft 2027: zuerst das Orga-Team, dann die Grußworte. */
  test("Begrüßung zeigt erst das Orga-Team, dann drei Grußworte", async ({ page }) => {
    await page.goto("/begruessung");

    const namen = page.getByRole("heading", { level: 2 });
    await expect(namen).toHaveCount(4);
    await expect(namen.nth(0)).toContainText("Vom Organisationsteam");
    await expect(namen.nth(1)).toContainText("Matthias Wilkes");
    await expect(namen.nth(2)).toContainText("Annegret Kramp-Karrenbauer");
    await expect(namen.nth(3)).toContainText("Ingo Meyer");
    await expect(page.getByText(/führt die Jahrestagung 2027 nach Hildesheim/)).toBeVisible();
  });

  /**
   * Der Text von Annegret Kramp-Karrenbauer fehlt noch. Statt eines erfundenen
   * Beispiels oder Blindtexts unter ihrem Namen steht dort, dass er folgt.
   */
  test("Begrüßung sagt, dass ein fehlendes Grußwort folgt", async ({ page }) => {
    await page.goto("/begruessung");

    const grusswort = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: "Annegret Kramp-Karrenbauer" }),
    });
    await expect(grusswort).toContainText("Das Grußwort folgt in Kürze.");
    await expect(page.getByText(/Lorem ipsum|Beispieltext/)).toHaveCount(0);
  });

  /** Das Orga-Team steht ohne Bild, die drei Grußworte mit Porträt. */
  test("Begrüßung zeigt die Porträts der drei Gastredner", async ({ page }) => {
    await page.goto("/begruessung");

    for (const name of ["Dr. Matthias Wilkes", "Annegret Kramp-Karrenbauer", "Dr. Ingo Meyer"]) {
      await expect(page.getByRole("img", { name: `Porträt von ${name}` })).toBeVisible();
    }
  });

  /**
   * Solange kein Album verknuepft ist, darf dort kein Knopf stehen, der ins
   * Leere fuehrt - dieselbe Regel wie bei den Bedienelementen im Programm.
   */
  test("Fotos bietet keinen Link ins Leere", async ({ page }) => {
    await page.goto("/fotos");

    await expect(page.getByRole("link", { name: /Fotos ansehen/ })).toHaveCount(0);
    await expect(page.getByText(/Passwort/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Vor dem Hochladen/ })).toHaveCount(0);
  });
});

/**
 * Hinweise an das Orga-Team ("Platzhalter", "Beispieltext", "noch nicht
 * abgestimmt") gehören nicht in die veröffentlichte App. Was noch fehlt, steht
 * im Backlog, nicht auf der Seite.
 */
test.describe("keine Entwurfshinweise", () => {
  const ENTWURF =
    /Platzhalter|Beispieltext|noch nicht abgestimmt|noch nicht hinterlegt|Zuständigkeit noch offen|Das Orga-Team hinterlegt|nicht vom Orga-Team geprüft|vom Vorstand vor der Veröffentlichung zu prüfen/;

  for (const pfad of [...SEITENBEREICHE.map((bereich) => `/${bereich.slug}`), "/datenschutz"]) {
    test(`${pfad} zeigt keine Entwurfshinweise`, async ({ page }) => {
      await page.goto(pfad);

      await expect(page.getByText(ENTWURF)).toHaveCount(0);
    });
  }
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

test.describe("Pflichtangaben", () => {
  /* Von einer Unterseite aus, nicht nur von der Startseite: Die Angaben muessen
     ueberall erreichbar sein. */
  for (const titel of ["Impressum", "Datenschutzerklärung"]) {
    test(`${titel} ist aus der Fußzeile erreichbar`, async ({ page }) => {
      await page.goto("/programm");
      await page
        .getByRole("navigation", { name: "Rechtliches" })
        .getByRole("link", { name: titel })
        .click();

      await expect(page.getByRole("heading", { level: 1, name: titel })).toBeVisible();
    });
  }
});
