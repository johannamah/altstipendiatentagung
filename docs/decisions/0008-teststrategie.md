# ADR-0008: Teststrategie und Zuschnitt der CI

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** ADR-0003; `AGENTS.md` Abschnitte „Testgetriebene Entwicklung" und „UI/UX und UI-Tests"

## Kontext

`AGENTS.md` legt das Vorgehen weitgehend fest: Red–Green–Refactor, Tests auf Ebene der
Akzeptanzkriterien, und je Pull Request Linting, Formatierung, Typprüfung,
Unit-/Integrationstests, Build, Playwright-End-to-End-Tests der priorisierten Kernreisen
sowie Lighthouse CI. Offen ist der konkrete Zuschnitt — und der entscheidet darüber, ob
die Regeln gelebt oder umgangen werden.

Die Spannung ist praktischer Natur: Browser- und Lighthouse-Läufe dauern Minuten. Wenn
jeder Pull Request zweier ehrenamtlicher Entwickler zehn Minuten auf eine rote Ampel
wartet, wird die Pipeline abgeschaltet oder umgangen. `AGENTS.md` sieht deshalb
ausdrücklich vor, langsame Jobs in eigene erforderliche Checks zu teilen, statt sie
stillschweigend auszulassen.

## Entscheidung

Zwei Stufen, beide blockierend für den Merge, aber getrennt laufend:

1. **Schnell (Ziel: unter zwei Minuten)** — Formatierung, Linting, Typprüfung,
   Unit- und Integrationstests mit Vitest, Build. Läuft bei jedem Push.
2. **Gründlich** — Playwright-End-to-End-Tests der bestätigten Kernreisen in einem
   echten Browser bei schmalem und breitem Viewport, automatisierte
   Barrierefreiheitsprüfung mit axe-core auf allen Hauptansichten, Lighthouse CI.
   Läuft auf Pull Requests.

Getestet wird **beobachtbares Verhalten**: Formularvalidierung, Fehlermeldungen,
Lade-, Leer- und Fehlerzustände, Berechtigungen. Locator werden nutzerorientiert
gewählt (Rolle, Beschriftung, sichtbarer Text), niemals über CSS-Klassen.

Die Schwellenwerte für Lighthouse werden **nach einem Basislauf** festgelegt und
schrittweise verschärft; Performance und Accessibility werden getrennt betrachtet, nicht
als Gesamtnote. Für Accessibility gilt von Beginn an: keine Verschlechterung gegenüber
dem Basiswert.

Die Kontingentlogik aus Journey J2 wird als reine Geschäftslogik getestet, unabhängig
von der Oberfläche — einschließlich des Falls „zwei Anmeldungen auf den letzten Platz".

## Konsequenzen

**Positiv:** Schnelle Rückmeldung im Alltag, ohne die gründlichen Prüfungen
aufzugeben. Barrierefreiheit wird messbar statt Absichtserklärung. Der riskanteste
Teil der Anwendung (Kontingente) ist ohne Browser testbar und damit schnell und
zuverlässig prüfbar.

**Negativ:** Zwei Pipelines sind mehr Einrichtungs- und Pflegeaufwand. End-to-End-Tests
sind die teuersten Tests und neigen zu sporadischen Fehlschlägen — sie brauchen
unabhängige Testdaten und Disziplin bei der Fehlersuche; ein dauerhaft instabiler Test
ist schlimmer als kein Test. axe-core findet etwa ein Drittel der realen Probleme: es
ersetzt keine manuelle Tastatur- und Screenreader-Prüfung, könnte aber fälschlich
Sicherheit suggerieren.

## Verworfene Alternativen

- **Alle Prüfungen in einem Job.** Einfacher einzurichten, aber jede Kleinänderung
  wartet auf den langsamsten Lauf — in der Praxis der Weg zur abgeschalteten Pipeline.
- **End-to-End-Tests und Lighthouse nur vor Releases.** Widerspricht `AGENTS.md` und
  verschiebt die Fehlersuche in den Moment des höchsten Zeitdrucks.
- **Vollständige visuelle Regressionstests aller Seiten.** `AGENTS.md` warnt selbst vor
  fragilen Vollseiten-Snapshots dynamischer Inhalte. Vorerst bleiben visuelle Tests auf
  wenige stabile Kernansichten beschränkt.

## Offene Punkte

- Werkzeugwahl hängt an ADR-0003; bei einer anderen Frontend-Entscheidung ist dieses
  ADR anzupassen.
- Welche Kernreisen sind fachlich bestätigt? `AGENTS.md` erlaubt End-to-End-Tests für
  die Anmeldung erst, wenn diese Funktion bestätigt ist (F3, F4).
- Konkrete Befehle werden erst nach Einrichtung des Stacks dokumentiert.
