import { expect, type Page } from "@playwright/test";

/**
 * Prueft Regel 10: Die Seite selbst darf sich nicht waagerecht schieben lassen.
 *
 * Geprueft wird das VERHALTEN, nicht die Kennzahl `scrollWidth`. Die ist kein
 * verlaesslicher Stellvertreter - sie war auf der Zeitachsenansicht um 1174px
 * groesser als das Fenster, obwohl sich nichts schieben liess.
 *
 * Schlaegt die Pruefung fehl, grenzt sie die Ursache ein, statt sie den
 * Lesenden zu ueberlassen: Ein Teilbaum nach dem anderen wird versuchsweise
 * ausgeblendet; verschwindet die Ueberbreite dabei, liegt die Ursache darin,
 * und es geht eine Ebene tiefer weiter. Tragen mehrere Geschwister gleichzeitig
 * bei, wird jedes einzeln gemessen.
 *
 * Das benennt den Verursacher auch dann, wenn kein einzelnes Rechteck ueber den
 * Rand ragt - etwa bei Pseudo-Elementen, oder bei absolut positionierten
 * Elementen, die an einem Scrollbereich vorbeikommen, weil der nicht
 * positioniert ist. Genau dieser Fall hat mehrere CI-Durchlaeufe gekostet,
 * solange die Diagnose nur Rechtecke verglichen hat.
 */
export async function erwarteKeinSeitenScroll(page: Page): Promise<void> {
  const spur = await page.evaluate(() => {
    const ueberbreite = () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth;

    if (ueberbreite() <= 0) return ["keine Ueberbreite messbar"];

    const beschreibe = (element: Element) => {
      const klasse = element.className?.toString().trim().split(/\s+/)[0];
      const kennung = element.id ? `#${element.id}` : klasse ? `.${klasse}` : "";
      return `${element.tagName.toLowerCase()}${kennung}`;
    };

    const pfad: string[] = [];
    let knoten: Element = document.body;

    suche: for (let tiefe = 0; tiefe < 12; tiefe += 1) {
      for (const kind of [...knoten.children]) {
        if (!(kind instanceof HTMLElement)) continue;

        const vorher = kind.style.display;
        kind.style.display = "none";
        const behoben = ueberbreite() <= 0;
        kind.style.display = vorher;

        if (behoben) {
          pfad.push(beschreibe(kind));
          knoten = kind;
          continue suche;
        }
      }
      break;
    }

    // Kein einzelnes Kind allein verantwortlich: jedes einzeln messen.
    const kinder = [...knoten.children].filter(
      (kind): kind is HTMLElement => kind instanceof HTMLElement,
    );
    const zustand = kinder.map((kind) => kind.style.display);

    for (const kind of kinder) kind.style.display = "none";

    const einzeln: string[] = [];
    for (const [index, kind] of kinder.entries()) {
      kind.style.display = zustand[index]!;
      const breit = ueberbreite();
      if (breit > 0) einzeln.push(`${beschreibe(kind)}: +${breit}px`);
      kind.style.display = "none";
    }

    for (const [index, kind] of kinder.entries()) kind.style.display = zustand[index]!;

    return [
      ...(pfad.length > 0 ? pfad : ["body"]),
      einzeln.length > 0 ? `einzeln: ${einzeln.join(", ")}` : "kein Kind allein verantwortlich",
    ];
  });

  // behavior "instant": basis.css schaltet weiches Scrollen ein, sonst misst
  // die Pruefung gegen eine noch laufende Animation.
  await page.evaluate(() => window.scrollTo({ left: 9999, behavior: "instant" }));
  const verschoben = await page.evaluate(() => window.scrollX);

  expect(
    verschoben,
    `Die Seite liess sich um ${verschoben}px seitwaerts schieben.\n  ${spur.join("\n  ")}`,
  ).toBe(0);
}
