# Mitarbeiten

Arbeitsweise, Reviewpflicht und Definition of Done stehen in [AGENTS.md](AGENTS.md).
Hier stehen nur die Befehle und der technische Aufbau.

## Einrichten

```bash
npm install
```

Node ab Version 22. CI und Dev-Container nutzen 24 (siehe `.nvmrc`). Einmalig empfohlen, damit Astro keine
Nutzungsdaten sendet — passend zu Produktprinzip 4:

```bash
npx astro telemetry disable
```

In der CI übernimmt das die Umgebungsvariable `ASTRO_TELEMETRY_DISABLED=1`.
Lässt sich das Benutzerverzeichnis nicht beschreiben (etwa in manchen
Containern), setzt man dieselbe Variable auch lokal vor den Befehl.

## Befehle

| Befehl                 | Zweck                                                       |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Entwicklungsserver auf <http://localhost:4321>              |
| `npm run build`        | Erzeugt den statischen Stand nach `dist/`                   |
| `npm run preview`      | Liefert den gebauten Stand aus — das, was Nutzende bekommen |
| `npm run format`       | Formatiert alle Dateien mit Prettier                        |
| `npm run format:check` | Prüft die Formatierung, ohne zu ändern                      |
| `npm run lint`         | ESLint über Projekt und Astro-Dateien                       |
| `npm run typecheck`    | `astro check` — Typprüfung inklusive der `.astro`-Dateien   |
| `npm run test`         | Unit- und Integrationstests (Vitest)                        |
| `npm run test:watch`   | Dieselben Tests im Beobachtungsmodus                        |
| `npm run test:e2e`     | End-to-End-Tests (Playwright, baut und startet selbst)      |
| `npm run pruefen`      | Alles aus der schnellen Prüfstufe hintereinander            |

Vor dem ersten `npm run test:e2e` einmalig:

```bash
npx playwright install --with-deps chromium
```

## Aufbau

```
src/
├── daten/        Inhaltsdaten, getrennt vom Markup (ADR-0006)
├── lib/          Reine, testbare Logik ohne DOM-Bezug
├── styles/       tokens.css (Designtokens) und basis.css (Grundstile)
├── components/   Wiederverwendbare Bausteine
├── layouts/      Seitengerüste
└── pages/        Je Datei eine Adresse
public/           Wird unverändert ausgeliefert (Icons, Manifest)
tests/
├── unit/         Vitest
└── e2e/          Playwright
docs/             Vision, offene Fragen, ADRs, Designregeln
archiv/           Der ursprüngliche Einzeldatei-Entwurf, siehe archiv/README.md
```

`src/daten/` enthält strukturelle Daten der Anwendung, etwa die Navigation.
Redaktionelle Inhalte mit Schema — Programm, FAQ, Hotels — gehören nach
`src/content/` ([ADR-0006](docs/decisions/0006-inhalte-als-daten.md)).

### `archiv/`

Der ursprüngliche Einzeldatei-Entwurf. Er bleibt laut
[ADR-0003](docs/decisions/0003-frontend-architektur.md) als Referenz bestehen,
**bis alle Ansichten überführt sind**, und wird nicht weiterentwickelt. Von Prettier
und ESLint ausgenommen, damit sein Diff lesbar bleibt; Astro baut ihn nicht mit.
Details in [archiv/README.md](archiv/README.md).

## Zwei Prüfstufen

Beide blockieren den Merge, laufen aber getrennt ([ADR-0008](docs/decisions/0008-teststrategie.md)):

1. **Schnell**, bei jedem Push: Formatierung, Linting, Typprüfung, Unit-Tests, Build.
2. **Gründlich**, bei Pull Requests: Playwright bei schmalem und breitem Viewport
   inklusive axe-Prüfung, dazu Lighthouse CI.

## Bevor du eine Farbe änderst

Farben kommen ausschließlich aus `src/styles/tokens.css`, benannt nach ihrer
**Rolle** ([ADR-0007](docs/decisions/0007-designsystem.md)). Ein `#` in einer
Komponentendatei ist ein Review-Befund.

`tests/unit/farbtokens.test.ts` prüft jede Farbänderung automatisch gegen
WCAG 2.2 AA — in heller **und** dunkler Darstellung. Schlägt der Test fehl, ist
nicht der Test das Problem.

## Bei UI-Änderungen

Die Prüfliste am Ende von [docs/ui-ux-designregeln.md](docs/ui-ux-designregeln.md)
gehört abgehakt in den Pull Request, dazu Screenshots in beiden Darstellungen bei
schmalem und breitem Viewport.
