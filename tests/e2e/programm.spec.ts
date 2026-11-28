import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { erwarteKeinSeitenScroll, oeffneProgrammpunkt } from "./hilfen.ts";

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
 * Der Kern von Issue #8: Die zehn Exkursionen am Freitag sind Alternativen
 * zueinander. Eine schlichte Liste liest sich wie eine Abfolge - dann meint man,
 * man koenne alle mitnehmen.
 */
test("weist gleichzeitige Exkursionen als Auswahl aus", async ({ page }) => {
  await expect(page.getByText("Exkursionen · 10 zur Wahl")).toBeVisible();
});

/**
 * Am Donnerstag laufen Mitgliederversammlung und die beiden Partnerprogramme
 * von 15:00 bis 17:00 - man muss sich entscheiden. Eine Liste, die beide
 * untereinander zeigt, verschweigt das.
 */
test("weist auch gleichzeitige Hauptprogrammpunkte als Auswahl aus", async ({ page }) => {
  await expect(page.getByText("Gleichzeitig · 3 zur Wahl")).toBeVisible();
});

test("zeigt die aktualisierten Zeiten und Orte aus dem Programmheft", async ({ page }) => {
  await expect(page.getByText("13:30–14:30 Uhr")).toBeVisible();
  // Das Weinfest endet um Mitternacht: im Deutschen 24:00, nicht 00:00.
  await expect(page.getByText("20:00–24:00 Uhr")).toBeVisible();
  // Der Abschluss am Sonntag beginnt jetzt um 10:30.
  await expect(page.getByText("10:30–12:00 Uhr")).toBeVisible();
  await expect(page.getByText("09:15–12:00 Uhr")).toBeVisible();
  // Das Konzert ist in den Dom umgezogen.
  await expect(
    page.locator('.punkt[data-id="konzert"]').getByText("Dom Mariä Himmelfahrt").first(),
  ).toBeVisible();
  await expect(page.getByText("Mariano-Josephinum").first()).toBeVisible();
  await expect(page.getByText("deseo Cafe . Restaurant . Bar").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Verabschiedung und Rückreise/ })).toBeVisible();
});

/**
 * Zehn Exkursionen untereinander schieben den Rest des Freitags weit nach
 * unten. Zugeklappt zeigt der Gruppenkopf, dass es sie gibt und wie viele.
 */
test("Exkursionen sind anfangs zugeklappt und lassen sich ausklappen", async ({ page }) => {
  const umschalter = page.getByRole("button", { name: /10 gleichzeitige Punkte/ });
  const exkursion = page.locator('.punkt[data-id="exkursion-hennies"]');

  await expect(umschalter).toHaveAttribute("aria-expanded", "false");
  await expect(exkursion).toBeHidden();

  await umschalter.click();
  await expect(umschalter).toHaveAttribute("aria-expanded", "true");
  await expect(exkursion).toBeVisible();
});

test("verweist auf die Übersicht aller Exkursionen", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Alle Exkursionen im Überblick" })).toHaveAttribute(
    "href",
    "/exkursionen",
  );
});

/**
 * Das Programmheft erscheint erst, wenn eine veröffentlichungsreife Fassung
 * vorliegt. Dann müssen Link und FAQ-Antwort zusammen da sein und die Datei
 * ein PDF sein - nicht nur eines von beiden.
 */
test("bietet das Programmheft nur zusammen mit einer echten Datei an", async ({
  page,
  request,
}) => {
  const link = page.getByRole("link", { name: /Programmheft als PDF/ });
  if ((await link.count()) === 0) {
    await page.goto("/faq");
    await expect(page.getByText(/Programmheft als PDF/)).toHaveCount(0);
    return;
  }
  const antwort = await request.get((await link.getAttribute("href")) ?? "");
  expect(antwort.headers()["content-type"]).toContain("application/pdf");
});

test("kündigt die Exkursionen mit einem Einleitungstext an", async ({ page }) => {
  await expect(
    page.getByText(/eröffnen zehn Exkursionen unterschiedliche Perspektiven/),
  ).toBeVisible();
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
  await expect(punkt.getByRole("heading", { name: /Europas Zukunft sichern/ })).toBeVisible();
  await expect(punkt.getByText("Mariano-Josephinum").first()).toBeVisible();

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
 * Am Freitag stehen zehn Exkursionen zur Wahl. Eine schlichte Liste liest
 * sich wie eine Abfolge - deshalb Einrueckung, Verbindungslinie UND ein Satz,
 * der es ausspricht.
 */
test("gleichzeitige Punkte sind eingerueckt und als Auswahl benannt", async ({ page }) => {
  await expect(page.getByText(/Diese Punkte laufen parallel/).first()).toBeVisible();

  const eingerueckt = page.locator("#tag-2027-05-07 .eintrag[data-gruppe]");
  await expect(eingerueckt).toHaveCount(10);

  const innen = await eingerueckt.first().evaluate((el) => getComputedStyle(el).borderLeftWidth);
  expect(parseFloat(innen)).toBeGreaterThan(0);
});

/** Mitgliederversammlung und Partnerprogramm: aufgeklappt, aber einklappbar. */
test("eine Gruppe laesst sich einklappen und wieder ausklappen", async ({ page }) => {
  const umschalter = page.getByRole("button", { name: /3 gleichzeitige Punkte/ });
  const partnerprogramm = page.locator('.punkt[data-id="partnerprogramm"]');
  await expect(umschalter).toHaveAttribute("aria-expanded", "true");

  await umschalter.click();
  await expect(umschalter).toHaveAttribute("aria-expanded", "false");
  await expect(partnerprogramm).toBeHidden();

  await umschalter.click();
  await expect(partnerprogramm).toBeVisible();
});

/**
 * Derzeit hat jeder Punkt eine Zeitangabe - der Abschnitt entfaellt deshalb.
 * Er erscheint wieder, sobald ein Punkt ohne Termin hinzukommt; das ist der
 * Punkt dieses Tests.
 */
test("blendet den Abschnitt fuer Punkte ohne Termin aus, solange es keine gibt", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "Noch ohne Termin" })).toHaveCount(0);
});

/**
 * Die Beschreibung kommt aus exkursionen.json, nicht aus dem Programm.
 * Sie hat mehrere Absaetze; jeder muss einen eigenen beginnen, statt im
 * Fliesstext davor unterzugehen.
 */
test("zeigt die Beschreibung einer Exkursion beim Aufklappen", async ({ page }) => {
  const punkt = page.locator('.punkt[data-id="exkursion-hennies"]');
  await oeffneProgrammpunkt(page, "exkursion-hennies");

  await expect(punkt.getByText(/^Was für die einen Abfall ist/)).toBeVisible();
  await expect(punkt.getByText(/^Bei unserem Unternehmensbesuch/)).toBeVisible();
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

/** Mitwirkende aus dem Programmheft erscheinen beim Aufklappen. */
test("nennt die Mitwirkenden eines Programmpunkts", async ({ page }) => {
  const punkt = page.locator('.punkt[data-id="panel-nie-wieder"]');
  await punkt.locator("summary").click();

  const mitwirkende = punkt.getByRole("list", { name: "Mitwirkende" });
  await expect(mitwirkende.getByText("Prof. Dr. Norbert Lammert")).toBeVisible();
  await expect(mitwirkende.getByText("Julia Ruhs")).toBeVisible();
  await expect(mitwirkende.getByText("Moderation")).toBeVisible();
});
