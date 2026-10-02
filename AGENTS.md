# Projektkontext: Veranstaltungsapp für den ASeV

## Ziel und Nutzer

Wir entwickeln zu zweit eine professionelle Veranstaltungsapp für den Verein „Altstipendiaten der Konrad-Adenauer-Stiftung e. V.“ (ASeV). Die App soll für die mehrtägige Jahrestagung zum Treffen der Alumnis als Veranstaltungsapp dienen. Sie dient dazu die Anmeldung, das Programm, Begrüßungsworte, Teilen von Fotos sowie weiteren Informationen z.B. Präsentationen der Referenten, Informationen zum Tagungsort, Informationen zum Hotelkontingent, Informationen zur Tagungsstatt, FAQs, Kontaktinformationen. Zielgruppe sind Vereinsmitglieder und weitere berechtigte Nutzer verständlich und verlässlich unterstützen.

Die Stiftung beschreibt die Alumni-Arbeit als Vernetzung über Regionalgruppen, thematische Netzwerke, Seminare, Tagungen, Kolloquien und Workshops. Nutze diese Vielfalt als fachlichen Ausgangspunkt. Erfinde keine verbindlichen Geschäftsregeln, Rollen, Zahlungsabläufe, Datenschutzfristen oder Integrationen: halte offene Punkte als Fragen bzw. Annahmen im Backlog fest und kläre sie vor einer davon abhängigen Umsetzung.

## Zusammenarbeit und Rollen

- Zwei Menschen entwickeln gemeinsam. Arbeitet über kleine, klar abgegrenzte Issues und kurzlebige Feature-Branches; stimmt größere Änderungen und API-/Datenmodelländerungen früh miteinander ab.
- Für jedes Issue ist durch eine zweite KI (z.B. Codex) oder durch einen Menschen zu reviewen.
- Claude Code, Codex und weitere Coding-Agenten sind Werkzeuge, keine menschlichen Reviewer. Ein zweites Modell, bevorzugt Codex, prüft Änderungen unabhängig auf Korrektheit, Sicherheits- und Datenschutzrisiken, Regressionen, Testlücken und Wartbarkeit.
- Ein Pull Request ist zu reviewen durch einen Menschen oder durch ein zweites Modell. Ein Merge darf nicht vom gleichen Modell vorgenommen werden, welches das Feature entwickelt hat
- Schützt den Hauptbranch: direkte Pushes und Force-Pushes deaktivieren, Pull Request verlangen, Reviewpflicht aktivieren und erforderliche Status Checks erzwingen. Wo verfügbar, veraltete Freigaben nach neuen Commits verwerfen und ungelöste Review-Konversationen vor Merge verlangen.
- Halte wichtige Entscheidungen und abgelehnte Alternativen knapp in `docs/decisions/` fest (ADR). Aktualisiere diese Datei, falls Projektregeln sich ändern.

## Vorgehen: Konzept, Backlog und Pull Requests

1. **Konzeption vor Umsetzung:** Erfasse Zielgruppen, Kernprobleme, zentrale Journeys, Systemgrenzen, Risiken und offene Fragen. Lege daraus Epics und Stories an.
2. **Epics:** Beschreiben ein fachliches Ziel und den messbaren Nutzen. Zerlege sie in lieferbare Stories.
3. **Stories:** Beschreiben Nutzer/Nutzerin, Bedürfnis und Nutzen. Jede Story hat überprüfbare Akzeptanzkriterien, Scope/Out-of-Scope, relevante Fehler- und Berechtigungsfälle sowie Testhinweise. Nutze Given/When/Then, wo es Klarheit schafft.
4. Schätze und priorisiere gemeinsam. Beginne keine Story, deren zentrale fachliche Annahmen ungeklärt sind.
5. **Pull Requests:** Ein PR adressiert möglichst ein Issue, enthält Kontext, Umsetzung, Testnachweise, UI-Screenshots bei sichtbaren Änderungen. Verknüpfe Issue und PR.
6. PRs sind klein und reviewbar. GitHub Actions führen bei jedem PR Linting, Typprüfung, Unit-/Integrationstests und Build aus. Richtet diese konkreten Workflow-Checks in den Branch-Regeln als erforderliche Status Checks ein; ein roter oder fehlender Check blockiert den Merge.
7. Erst nach unabhängiger Modellprüfung, erfolgreicher CI und Freigabe durch die zweite menschliche Person darf diese mergen. Nutzt Squash-Merge, wenn das Repository keine andere Teamkonvention festlegt.
8. Deployment-Pipelines werden mit GitHub Actions umgesetzt. Automatische Deployments auf Vorschau-/Testumgebungen können nach erfolgreicher PR-CI laufen. Produktivdeployments laufen nur über den freigegebenen Hauptbranch bzw. einen klar definierten Release-Prozess, mit GitHub Environments und erforderlichen Freigaben, falls verfügbar. Secrets nur als geschützte GitHub Actions Secrets/Environment Secrets verwalten.

## Testgetriebene Entwicklung

- Arbeite im Red–Green–Refactor-Zyklus: zuerst einen aussagekräftigen fehlschlagenden Test schreiben, dann die kleinste passende Implementierung, anschließend vereinfachen.
- Schreibe Tests auf der Ebene der fachlichen Akzeptanzkriterien. Vermeide Tests, die nur interne Implementierungsdetails festschreiben.
- Vor Abschluss einer Story müssen passende Unit- und Integrationstests sowie alle relevanten statischen Prüfungen laufen. Halte Befehle und Ergebnisse im PR fest.
- Für Defekte: reproduzierenden Regressionstest ergänzen, bevor die Korrektur erfolgt.
- GitHub Actions prüfen für jeden PR Linting, Formatierung, Typprüfung, Unit-/Integrationstests, Build, Playwright-End-to-End-Tests der priorisierten Kernreisen und Lighthouse CI. Teile langsame Browser-/Lighthouse-Jobs bei Bedarf in eigene erforderliche Checks, statt sie stillschweigend auszulassen.
- Externe Dienste in automatisierten Tests kontrolliert ersetzen; keine echten Nutzer-/Produktionsdaten verwenden.
- Wenn ein Test nicht sinnvoll automatisierbar ist, begründe das und dokumentiere die manuelle Prüfanleitung im PR.

## UI/UX und UI-Tests

- Gestalte für die tatsächlichen Nutzungssituationen: Veranstaltungen finden, Details verstehen, Teilnahme/Anmeldung verwalten und relevante Änderungen erkennen. Diese Journeys sind zu validierende Produktannahmen, keine bereits bestätigten Anforderungen.
- Baue zuerst Informationsarchitektur und klickbare Kernabläufe. Prüfe sie früh mit beiden Entwicklern und, sobald erreichbar, mit repräsentativen Nutzern.
- Nutze ein konsistentes Designsystem mit klarer Typografie, Abständen, Farben, Formularzuständen und Komponenten. Bevorzuge verständliche Sprache, gute Lesbarkeit, responsive Layouts und barrierearme Bedienung per Tastatur und Screenreader.
- UI-Änderungen müssen angemessene automatisierte Tests erhalten: Komponententests für Zustände und Interaktionen sowie funktionale End-to-End-Tests mit Playwright für bestätigte zentrale Nutzerreisen. Playwright läuft in CI in einem echten Browser. Wichtige Ansichten bei schmalen und breiten Viewports prüfen.
- Playwright-Tests decken zunächst bestätigte Abläufe ab, etwa Veranstaltungssuche und Öffnen einer Detailseite. Anmeldung, Buchung oder Zahlung nur testen und bauen, wenn diese Funktionen fachlich bestätigt sind. Verwende stabile, benutzerorientierte Locator (Rollen, Labels, sichtbarer Text) und unabhängige Testdaten.
- Screenshot-/visuelle Regressionstests mit Playwright können für ausgewählte stabile Kernansichten eingesetzt werden. Halte Browser-/Viewport-Versionen und Testdaten reproduzierbar; prüfe Snapshot-Änderungen im PR visuell und vermeide fragile Vollseiten-Snapshots dynamischer Inhalte.
- Integriere Lighthouse CI in die PR-Pipeline für wiederholbare Performance- und Accessibility-Prüfungen auf repräsentativen Ansichten. Lege Schwellenwerte nach einem Baseline-Lauf und anhand der konkreten Anwendung fest. Betrachte einzelne Kategorien und Metriken (mindestens Performance und Accessibility sowie bei Relevanz Best Practices/SEO), nicht nur einen aggregierten Gesamtscore. Dokumentiere Schwellenwerte und Ausnahmen; verschärfe sie schrittweise, statt willkürliche Grenzwerte einzuführen.
- UI-Tests sollen beobachtbares Verhalten absichern (z. B. Formularvalidierung, Fehlermeldungen, Lade-/Leerzustände, Berechtigungen), nicht fragile CSS-Klassennamen.
- PRs mit UI-Änderungen zeigen Screenshots oder kurze Aufnahmen der relevanten Zustände.

## Corporate Design und Markenführung

- Ziel ist eine eigenständige, hochwertige Gestaltung, die zur Identität des ASeV und zur Konrad-Adenauer-Stiftung passt.
- Nutze offizielle, freigegebene Logos, Farben, Schriftvorgaben und Bildwelten erst, wenn sie aus offiziellen Markenunterlagen oder vom Verein bereitgestellten Assets bestätigt sind. Erfinde keine offiziellen Hex-Farbwerte und verändere keine Logos.
- Beachte ausreichende Kontraste und barrierearme Alternativen unabhängig von der Markenfarbe.

## Technische Architektur

- Entscheide die konkrete Architektur erst nach Klärung von Plattform (Web, mobil oder beides), Nutzergruppen, Authentifizierung, Datenarten, Integrationen, Datenschutz/Sicherheitsbedarf, Betrieb und erwarteter Last.
- Wähle den einfachsten wartbaren Aufbau, der die bestätigten Anforderungen erfüllt. Bevorzuge klare Modulgrenzen, explizite Schnittstellen, nachvollziehbare Datenflüsse und möglichst wenige Laufzeitkomponenten.
- Trenne UI, Anwendungslogik und Persistenz sinnvoll; halte Geschäftsregeln testbar und unabhängig von UI-Details.
- Lege Datenmodell, Berechtigungen, Fehlerbehandlung, Protokollierung, Backups und Migrationsstrategie fest, bevor produktive Nutzerdaten verarbeitet werden.
- Sichere Eingaben serverseitig ab. Vertrauliche Daten und Zugangsdaten gehören nicht ins Repository oder in Logs. Folge dem Prinzip minimaler Berechtigungen.
- Dokumentiere wesentliche Architekturentscheidungen als ADR mit Kontext, Entscheidung und Konsequenzen. Keine Infrastruktur oder Technologie nur aus Gewohnheit einführen.
- Leite konkrete Build-, Lint-, Typprüfungs- und Testbefehle aus dem tatsächlich gewählten Stack ab und halte sie im Repository (z. B. README/CONTRIBUTING) aktuell. Erfinde keine Befehle.

## Definition of Done

Eine Story ist abgeschlossen, wenn:

- Akzeptanzkriterien erfüllt und im Review nachvollziehbar sind.
- Tests nach TDD ergänzt wurden und die relevante Test-Suite grün ist.
- Linting, Formatierung, Typprüfung, Build und erforderliche GitHub Actions Checks erfolgreich sind.
- Relevante Playwright-End-to-End-Tests und Lighthouse-CI-Prüfungen erfolgreich sind; Abweichungen sind im PR begründet und nicht stillschweigend akzeptiert.
- Zentrale UI-Flows responsive und barrierearm geprüft wurden, sofern betroffen.
- Dokumentation, Backlog und ADRs passend aktualisiert sind.
- Ein unabhängiger Modellreview (bevorzugt Codex) durchgeführt und Findings behoben oder begründet verworfen wurden.
- Die zweite menschliche Person den PR geprüft und freigegeben hat; erst sie merged.

## Verhalten von Coding-Agenten

- Lies zuerst vorhandene Projektdateien, Issues und Entscheidungen. Prüfe den Status des Arbeitsbaums und überschreibe keine fremden Änderungen.
- Frage bei fehlenden Produktentscheidungen nicht blind nach, wenn die Arbeit unabhängig davon fortgesetzt werden kann: dokumentiere offene Punkte und bearbeite unabhängige Aufgaben. Implementiere keine spekulativen Produktregeln.
- Teile größere Aufgaben in überprüfbare Schritte und melde konkrete Änderungen, Tests, offene Annahmen und Risiken.
- Bei Reviews zuerst konkrete Findings mit Schweregrad, Datei/Zeile und Begründung nennen. Falls keine Findings vorliegen, verbleibende Testlücken aufführen. Änderungen während eines Reviews nur auf ausdrücklichen Auftrag.
- Keine Secrets, privaten Nutzerdaten oder produktiven Daten in Prompts, Commits, Screenshots oder Test-Fixtures aufnehmen.
