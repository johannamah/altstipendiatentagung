# ADR-0002: Plattform — installierbare Web-App statt nativer Apps

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** offene Frage F1; `docs/vision.md` Abschnitt 3

## Kontext

`AGENTS.md` verlangt, die Plattformfrage vor der Architektur zu klären. Randbedingungen:
zwei ehrenamtliche Entwickler, fixer Tagungstermin (5.–9. Mai 2027, rund sieben Monate),
eine altersgemischte Zielgruppe und eine Nutzung, die sich auf wenige Tage im Jahr
konzentriert. Der bestehende Entwurf ist bereits eine Website mit `site.webmanifest`
und Homescreen-Icons; die Absicht, sie wie eine App zu nutzen, ist also schon angelegt.

Entscheidend ist Journey J3 („Was läuft jetzt, wo?"): sie verlangt schnellen Start und
Funktion bei schlechtem Netz — nicht zwingend native Fähigkeiten.

## Entscheidung

Wir bauen eine installierbare Web-App (PWA): eine Codebasis, ausgeliefert über das Web,
per Homescreen installierbar, mit Service Worker für Offline-Nutzung der
Programminhalte. Wir veröffentlichen keine nativen Apps in App Store oder Play Store.

## Konsequenzen

**Positiv:** Eine Codebasis für alle Geräte. Keine Store-Freigabeprozesse zwischen uns
und einem fixen Termin — eine Korrektur am Tagungsmorgen ist in Minuten live. Kein
Installationszwang: Wer nur einmal ins Programm schaut, öffnet einen Link. Kein
Entwicklerkonto, keine jährlichen Gebühren, keine Signaturzertifikate für einen Verein
zu verwalten.

**Negativ:** Push-Benachrichtigungen sind auf iOS nur nach Installation auf dem
Homescreen möglich und insgesamt unzuverlässiger als nativ — Journey J4 darf sich
deshalb **nicht allein auf Push stützen** (siehe F9). Die Offline-Fähigkeit muss aktiv
gebaut und getestet werden, sie ergibt sich nicht von selbst. Ein Service Worker mit
falscher Cache-Strategie kann veraltete Programmdaten ausliefern — das verletzt
Produktprinzip 1 und braucht eine bewusste Strategie plus Test.

## Verworfene Alternativen

- **Native Apps (Swift/Kotlin) oder React Native/Flutter.** Store-Prozesse, doppelte
  Plattformpflege und Signaturverwaltung sind für zwei Ehrenamtliche neben dem fixen
  Termin nicht tragbar. Der Nutzen — im Wesentlichen zuverlässigere Push — steht in
  keinem Verhältnis.
- **Reine Website ohne Installierbarkeit.** Verliert die Offline-Fähigkeit, die genau
  in der Phase „Vor Ort" den Unterschied macht.

## Offene Punkte

- F1: Bestätigung durch den Vorstand, dass keine Store-Apps erwartet werden.
- F9: Welcher Kanal trägt kurzfristige Änderungen verlässlich? Entscheidet, ob Web-Push
  überhaupt gebaut wird.
