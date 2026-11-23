import { SEITENBEREICHE } from "../daten/bereiche.ts";
import { RECHTLICHES } from "../daten/rechtliches.ts";

/**
 * Der Service Worker als Text - erzeugt statt handgeschrieben (ADR-0002).
 *
 * Warum erzeugt: Die Liste der vorab zu speichernden Seiten muss zu den
 * Bereichen der Startseite passen. Eine handgepflegte Liste im Worker waere
 * genau die Dublette, die irgendwann auseinanderlaeuft - ein neuer Bereich
 * faellt online nicht auf und ist offline leer. Hier kommt sie aus derselben
 * Quelle wie die Kacheln, und tests/unit/serviceworker.test.ts haelt das fest.
 *
 * Warum kein Workbox: Der Bedarf ist eine Handvoll Regeln, die man lesen
 * koennen muss, um sie zu verantworten. Ein Werkzeug, das daraus eine
 * Konfiguration mit unbekanntem Laufzeitverhalten macht, waere hier die
 * groessere Unbekannte - und AGENTS.md verlangt moeglichst wenige
 * Laufzeitkomponenten.
 */

/**
 * Adressen, die bereits bei der Installation in den Speicher gehen - also noch
 * bevor sie jemand aufgerufen hat. Ohne das waere offline nur erreichbar, was
 * man vorher zufaellig schon besucht hat.
 */
export function vorabAdressen(): readonly string[] {
  return [
    "/",
    ...SEITENBEREICHE.map((bereich) => `/${bereich.slug}/`),
    ...RECHTLICHES.map((seite) => `/${seite.slug}/`),
    // Ohne Manifest und Icons zeigt die installierte App auf dem
    // Startbildschirm ein leeres Symbol.
    "/site.webmanifest",
    "/logo-icon-192.png",
    "/logo-icon-512.png",
    "/apple-touch-icon.png",
    "/favicon.ico",
  ];
}

/**
 * @param fassung Kennzeichnet den Speicher dieses Builds. Aendert sie sich,
 *   wirft der Worker beim Aktivieren den alten Speicher weg.
 */
export function serviceWorkerQuelle(fassung: string, adressen: readonly string[]): string {
  const liste = adressen.map((adresse) => `  "${adresse}",`).join("\n");

  // Bewusst ohne Template-Ausdruecke im erzeugten Code: Ein vergessenes
  // Dollarzeichen waere im Browser ein stiller Syntaxfehler, und ein Worker,
  // der nicht startet, faellt online ueberhaupt nicht auf.
  return `/* Erzeugt aus src/lib/serviceworker.ts - nicht von Hand aendern. */

const FASSUNG = "${fassung}";
const SPEICHER = "asev-" + FASSUNG;

const VORAB = [
${liste}
];

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      const speicher = await caches.open(SPEICHER);

      /* Einzeln und fehlertolerant statt cache.addAll: Dort laesst eine einzige
         nicht erreichbare Adresse die ganze Installation scheitern - und damit
         waere die App offline gar nicht verfuegbar statt nur unvollstaendig. */
      await Promise.all(
        VORAB.map(async (adresse) => {
          try {
            await speicher.add(new Request(adresse, { cache: "reload" }));
          } catch {
            /* Eine fehlende Seite ist kein Grund, die uebrigen aufzugeben. */
          }
        }),
      );
    })(),
  );
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("asev-") && name !== SPEICHER) {
          await caches.delete(name);
        }
      }

      /* Damit schon der laufende Aufruf bedient wird und nicht erst der
         naechste - sonst wirkt die Installation wie ausgefallen. */
      await self.clients.claim();
    })(),
  );
});

/* Seiten: zuerst das Netz, der Speicher nur als Auffangnetz.
   Umgekehrt waere bequemer, aber ein veraltetes Programm ist der Totalschaden
   aus Produktprinzip 1 - der Fehler faellt erst vor dem falschen Raum auf. */
async function netzZuerst(anfrage) {
  const speicher = await caches.open(SPEICHER);

  try {
    const antwort = await fetch(anfrage);

    if (antwort.ok) {
      await speicher.put(anfrage, antwort.clone());
    }

    return antwort;
  } catch {
    const gespeichert = await speicher.match(anfrage, { ignoreSearch: true });
    if (gespeichert) return gespeichert;

    /* Letzte Stufe: Eine Seite, die noch nie geladen wurde, bei fehlendem Netz.
       Lieber eine ehrliche Auskunft als die Fehlerseite des Browsers. */
    return new Response(
      '<!doctype html><html lang="de"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        "<title>Offline</title></head><body style=\\"font-family:system-ui;padding:2rem;line-height:1.6\\">" +
        "<h1>Diese Seite liegt noch nicht auf dem Gerät</h1>" +
        "<p>Es besteht gerade keine Verbindung. Die bereits geöffneten Seiten " +
        "sind weiterhin verfügbar.</p>" +
        '<p><a href="/">Zur Übersicht</a></p>' +
        "</body></html>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

/* Gebaute Dateien tragen einen Inhaltshash im Namen: Aendert sich der Inhalt,
   aendert sich die Adresse. Deshalb kann der Speicher hier ohne Risiko zuerst
   antworten - eine getroffene Adresse ist nie veraltet. */
async function cacheZuerst(anfrage) {
  const speicher = await caches.open(SPEICHER);
  const gespeichert = await speicher.match(anfrage);
  if (gespeichert) return gespeichert;

  const antwort = await fetch(anfrage);
  if (antwort.ok) {
    await speicher.put(anfrage, antwort.clone());
  }

  return antwort;
}

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;

  /* Nur GET: Eine Anmeldung aus dem Speicher zu beantworten waere ein
     Datenschaden, kein Komfort (ADR-0004). */
  if (anfrage.method !== "GET") return;

  const adresse = new URL(anfrage.url);

  /* Fremde Herkunft geht uns nichts an - Produktprinzip 4. */
  if (adresse.origin !== self.location.origin) return;

  if (anfrage.mode === "navigate") {
    ereignis.respondWith(netzZuerst(anfrage));
    return;
  }

  ereignis.respondWith(cacheZuerst(anfrage));
});
`;
}
