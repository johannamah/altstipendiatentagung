# ADR-0003: Vom Einzeldatei-Entwurf zu einer gebauten Anwendung

- **Status:** Angenommen
- **Datum:** 2026-09-26
- **Bezug:** ADR-0002, ADR-0006, ADR-0008; `AGENTS.md` Abschnitte „Testgetriebene Entwicklung" und „Technische Architektur"

## Kontext

Der heutige Stand ist eine einzelne Datei: `index.html`, 1706 Zeilen, 370 KB, mit
eingebettetem CSS, eingebettetem JavaScript, eingebetteten Inhaltsdaten und zwei
base64-kodierten Logos (zusammen rund 273 KB, etwa 74 % der Datei). Das war für einen
Entwurf die richtige Wahl — er läuft per Doppelklick und ohne Werkzeuge.

Für das Zielprodukt trägt es nicht mehr:

- `AGENTS.md` fordert Linting, Formatierung, **Typprüfung**, Unit- und
  Integrationstests sowie einen Build bei jedem Pull Request. Auf eine einzelne
  HTML-Datei mit Inline-Skript lässt sich davon kaum etwas sinnvoll anwenden.
- Geschäftslogik (Kontingente), Darstellung und Inhalt liegen in derselben Datei.
  `AGENTS.md` verlangt, Geschäftsregeln testbar und unabhängig von UI-Details zu halten.
- Zwei Menschen können an einer 1706-Zeilen-Datei kaum parallel arbeiten, ohne dauernd
  zu kollidieren.
- Die inline eingebetteten Logos blockieren das erste Rendern, obwohl `logo-full.png`
  bereits als Datei daneben liegt.

`AGENTS.md` verlangt zugleich den **einfachsten wartbaren Aufbau** und verbietet,
Technologie aus Gewohnheit einzuführen. Der Inhalt ist überwiegend statisch; echte
Interaktivität brauchen nur Anmeldeformular, Programmfilter und Suche.

## Entscheidung

Wir überführen den Entwurf in ein Astro-Projekt mit TypeScript und Vite als
Build-Werkzeug. Seiten werden statisch erzeugt; JavaScript wird nur für die tatsächlich
interaktiven Bereiche als Insel ausgeliefert. Der Entwurf `index.html` bleibt bis zur
Ablösung als lauffähige Vorschau erhalten und wird erst entfernt, wenn alle Ansichten
überführt sind.

## Konsequenzen

**Positiv:** Typprüfung, Linting und Unit-Tests werden möglich — damit erst wird die
Definition of Done aus `AGENTS.md` erfüllbar. Statische Erzeugung passt zum Inhalt und
liefert von sich aus gute Lighthouse-Werte (Produktprinzip 3). Astro-Content-Collections
greifen direkt in ADR-0006. Kleine, reviewbare Dateien statt einer Monolithdatei. Das
Ergebnis bleibt auf GitHub Pages veröffentlichbar.

**Negativ:** Die Einfachheit „HTML anklicken und es läuft" geht verloren; es braucht
Node, ein Installationsschritt und eine Werkzeugkette, die gepflegt werden will.
Astro ist für beide Entwickler vermutlich neu — Einarbeitungszeit gegen einen fixen
Termin. Die Überführung ist Arbeit ohne sichtbaren Nutzerwert; sie muss in kleinen
Schritten laufen, damit stets etwas Lauffähiges existiert.

## Verworfene Alternativen

- **Beim Einzeldatei-Ansatz bleiben.** Widerspricht der geforderten Qualitätssicherung
  direkt; Typprüfung und Unit-Tests wären nicht darstellbar. Die Kontingentlogik aus J2
  ungetestet zu lassen, ist bei verbindlichen Anmeldungen nicht vertretbar.
- **Vite + TypeScript ohne Framework.** Leichter und ohne neue Konzepte, aber wir bauen
  Routing, Seitenerzeugung und Inhaltsverwaltung selbst — genau das, was Astro mitbringt.
  Bleibt die Rückfallposition, falls sich Astro als Fehlgriff erweist.
- **SvelteKit oder Next.js.** Beide können mehr, als hier gebraucht wird, und liefern
  mehr JavaScript aus. Angemessen erst, wenn die App überwiegend dynamisch würde.
- **WordPress oder ein anderes fertiges CMS.** Laufende Wartung, Sicherheitsaktualisierungen
  und ein Serverbetrieb, den zwei Ehrenamtliche dauerhaft tragen müssten.

## Offene Punkte

- Verbindliche Build-, Lint-, Typprüfungs- und Testbefehle sind nach der Einrichtung in
  `README.md` oder `CONTRIBUTING.md` zu dokumentieren (`AGENTS.md`: keine Befehle erfinden).
- Verhältnis zu ADR-0004: Wenn die Anmeldung serverseitig läuft, ist zu entscheiden, ob
  Astro nur statisch erzeugt oder auch serverseitige Endpunkte übernimmt.
