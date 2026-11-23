import type { APIRoute } from "astro";

import { serviceWorkerQuelle, vorabAdressen } from "../lib/serviceworker.ts";

/**
 * Liefert /sw.js aus dem Bauvorgang - als Endpunkt und nicht als Datei in
 * public/, damit die Liste der vorab gespeicherten Seiten aus denselben Daten
 * kommt wie die Startseite (siehe src/lib/serviceworker.ts).
 *
 * Der Worker MUSS im Wurzelverzeichnis liegen: Sein Geltungsbereich ist der
 * eigene Ordner. Aus /js/sw.js heraus waere /programm/ fuer ihn unerreichbar.
 */

/**
 * Kennzeichnet den Speicher dieses Builds. Die Bauzeit genuegt und ist
 * nachvollziehbar; ein Inhaltshash waere genauer, aber der Speicher wird beim
 * Aktivieren ohnehin vollstaendig erneuert, und die App ist klein.
 */
const FASSUNG = new Date().toISOString();

export const GET: APIRoute = () =>
  new Response(serviceWorkerQuelle(FASSUNG, vorabAdressen()), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      /* Ein zwischengespeicherter Worker wuerde eine Korrektur am Tagungsmorgen
         um Stunden verzoegern - genau das Versprechen aus ADR-0002. */
      "Cache-Control": "no-cache",
    },
  });
