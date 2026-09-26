# Jahrestagung 2027 – Veranstaltungsapp des ASeV

Veranstaltungsapp für die Jahrestagung der **Altstipendiaten der
Konrad-Adenauer-Stiftung e. V.** vom 5.–9. Mai 2027 in Hildesheim: Programm,
Anmeldung, Unterbringung, Informationen zu Stadt und Tagungsort, FAQ, Fotos und
Kontakt.

> **Stand:** im Aufbau. Inhalte sind teils Platzhalter, Impressum und
> Datenschutzhinweise sind **nicht** verbindlich. Die Anwendung ist noch nicht
> zur Veröffentlichung geeignet.

## Wo was steht

| Frage                                      | Datei                                                    |
| ------------------------------------------ | -------------------------------------------------------- |
| Was bauen wir, für wen, warum?             | [docs/vision.md](docs/vision.md)                         |
| Was ist noch nicht entschieden?            | [docs/offene-fragen.md](docs/offene-fragen.md)           |
| Warum ist etwas so gebaut?                 | [docs/decisions/](docs/decisions/)                       |
| Wie sieht und verhält sich die Oberfläche? | [docs/ui-ux-designregeln.md](docs/ui-ux-designregeln.md) |
| Wie arbeiten wir zusammen?                 | [AGENTS.md](AGENTS.md)                                   |
| Wie starte ich das Projekt?                | [CONTRIBUTING.md](CONTRIBUTING.md)                       |

## Schnellstart

```bash
npm install
npm run dev     # http://localhost:4321
```

Alle weiteren Befehle stehen in [CONTRIBUTING.md](CONTRIBUTING.md).

## Technischer Rahmen

Astro mit TypeScript, statisch erzeugt; JavaScript wird nur dort ausgeliefert, wo
tatsächlich Interaktion stattfindet ([ADR-0003](docs/decisions/0003-frontend-architektur.md)).
Geplant ist eine installierbare Web-App statt nativer Apps
([ADR-0002](docs/decisions/0002-plattform-pwa.md)).

Farben, Abstände und Schriftgrößen kommen aus rollenbasierten Designtokens
([ADR-0007](docs/decisions/0007-designsystem.md)); ihre Kontraste werden bei jedem
Lauf gegen WCAG 2.2 AA geprüft.

## Der ursprüngliche Entwurf

`index.html` im Wurzelverzeichnis ist der erste, eigenständige Entwurf ohne
Build-Werkzeuge. Er bleibt als lauffähige Vorschau bestehen, bis alle Ansichten
überführt sind, und wird nicht weiterentwickelt. Details in
[ADR-0003](docs/decisions/0003-frontend-architektur.md).

## Veröffentlichung

Noch nicht eingerichtet. Zielumgebung und Domain sind offen (siehe F11 in
[docs/offene-fragen.md](docs/offene-fragen.md)); der Bauprozess erzeugt einen rein
statischen Stand in `dist/`, der sich unter anderem über GitHub Pages ausliefern
ließe.

## Mitwirkende

Zwei ehrenamtliche Entwickler des Vereins, unterstützt durch Coding-Agenten.
Reviewpflicht und Definition of Done stehen in [AGENTS.md](AGENTS.md).
