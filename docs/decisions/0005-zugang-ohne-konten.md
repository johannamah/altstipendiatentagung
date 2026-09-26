# ADR-0005: Zugang ohne Benutzerkonten

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** offene Fragen F3, F4; ADR-0004

## Kontext

Ein Teil der App ist reine Information (Programm, Tagungsort, Unterbringung, FAQ,
Kontakt), ein anderer betrifft konkrete Personen (eigene Anmeldung einsehen oder
ändern, Fotos hochladen). `AGENTS.md` verlangt das Prinzip minimaler Berechtigungen und
verbietet erfundene Rollenmodelle.

Die Zielgruppe nutzt die App im Kern an fünf Tagen. Ein Konto mit Passwort ist für
diesen Zweck eine hohe Hürde — besonders im oberen Altersspektrum (Annahme A2) — und
erzeugt bei uns dauerhaften Betriebsaufwand: Passwort-Hashing, Zurücksetzen,
gesperrte Konten, Support. Der Verein erreicht seine Mitglieder ohnehin per E-Mail.

## Entscheidung

Wir führen keine Benutzerkonten mit Passwörtern. Stattdessen:

1. **Öffentlich zugänglich, ohne Identifikation:** alle rein informierenden Inhalte.
2. **Bestätigung per E-Mail-Einmallink:** personenbezogene Vorgänge. Wer sich anmeldet,
   erhält einen zeitlich begrenzten, einmalig gültigen Link; darüber lässt sich die
   eigene Anmeldung später einsehen und ändern.
3. **Orga-Zugang getrennt:** Verwaltende Funktionen laufen über einen separaten,
   ausdrücklich vergebenen Zugang — nicht über eine Rolle am Teilnehmendenkonto.

## Konsequenzen

**Positiv:** Keine Passwörter, die wir speichern, absichern oder zurücksetzen müssen —
das größte einzelne Sicherheitsrisiko entfällt. Niedrigste Einstiegshürde für die
Zielgruppe. Die E-Mail-Adresse wird ohnehin für die Anmeldung gebraucht, es entsteht
kein zusätzliches Datum.

**Negativ:** Wir werden von der Zustellbarkeit von E-Mail abhängig — landet der Link im
Spam, ist der Vorgang blockiert, und das trifft genau die weniger technikaffinen
Nutzenden. Einmallinks in E-Mail-Postfächern sind ein eigener Angriffspfad und brauchen
kurze Gültigkeit, Einmalverwendung und Rate-Limiting. Ohne dauerhafte Sitzung müssen
sich Nutzende bei jedem neuen Gerät erneut bestätigen. Der Orga-Zugang braucht ein
eigenes, sauber durchdachtes Verfahren.

## Verworfene Alternativen

- **Konto mit E-Mail und Passwort.** Mehr Betriebsaufwand und mehr Risiko bei geringem
  Zusatznutzen für eine Nutzung von wenigen Tagen im Jahr.
- **Ein gemeinsames Zugangswort für alle Mitglieder.** Nicht personenbezogen, nicht
  einzeln widerrufbar, wandert erfahrungsgemäß binnen Tagen aus dem Verein hinaus.
- **Anmeldung über Google-, Microsoft- oder Social-Konten.** Datenabfluss an Dritte,
  schlechter Zielgruppenzuschnitt, zusätzliche Abhängigkeit.
- **Vollständiger Zugangsschutz der gesamten App.** Widerspricht dem Zweck: Programm
  und Tagungsort sollen ohne Hürde teilbar sein. Falls F3 anders entschieden wird,
  muss dieses ADR abgelöst werden.

## Offene Punkte

- **F3** — Ist die App öffentlich oder nur für Berechtigte? Diese Antwort kann die
  gesamte Entscheidung kippen.
- Versandweg für E-Mail (eigener Server, Vereinspostfach, Versanddienst) und dessen
  Datenschutzrahmen hängen an F2.
