# Vision: Veranstaltungsapp des ASeV

**Status:** Entwurf zur gemeinsamen Abstimmung · **Stand:** 2026-09-26

Dieses Dokument beschreibt das Zielbild. Es ist die Grundlage für Epics, Stories und ADRs.
Alles hier Genannte ist eine **zu validierende Produktannahme**, keine bestätigte Anforderung,
sofern nicht ausdrücklich als bestätigt markiert. Offene Punkte stehen in
[offene-fragen.md](offene-fragen.md).

---

## 1. Ausgangslage

Es existiert ein funktionsfähiger, klickbarer Entwurf: `index.html`, eine eigenständige
Datei (1706 Zeilen, 370 KB) ohne Build-Werkzeuge, veröffentlichbar über GitHub Pages.
Sie enthält bereits Startseite, Programm, Anmeldeformular mit Kontingentlogik,
Grußwort, Unterbringung, Stadtinformationen, FAQ, Fotos, Ankündigungen und Kontakt,
dazu ein durchdachtes Farbtoken-System mit Hell-/Dunkeldarstellung und ein eigenes
SVG-Icon-Set.

Dieser Entwurf ist **wertvoll als validierte Informationsarchitektur** — er zeigt, dass
der inhaltliche Zuschnitt trägt. Er ist **nicht** die Zielarchitektur: Anmeldedaten
liegen nur im Arbeitsspeicher der Sitzung, Inhalte stecken als Literale im Code, und
die von `AGENTS.md` geforderten Prüfungen (Linting, Typprüfung, Unit-Tests, Build)
lassen sich auf eine einzelne HTML-Datei nicht sinnvoll anwenden.

Die Tagung findet vom **5.–9. Mai 2027 in Hildesheim** statt. Der Termin ist fix und
nicht verhandelbar; er ist die härteste Randbedingung des Projekts.

## 2. Zielbild in einem Satz

> Die App ist der eine verlässliche Ort für alles rund um die Jahrestagung —
> vor, während und nach der Veranstaltung —, bedienbar quer durch das Altersspektrum
> des Vereins, auch mit schlechtem Netz und ohne vorherige Erklärung.

## 3. Die drei Nutzungsphasen

Der Bedarf unterscheidet sich je Phase grundlegend. Wer das übersieht, baut eine
Broschüre statt einer App.

| Phase | Zeitraum | Leitfrage der Nutzenden | Gerät / Situation |
|---|---|---|---|
| **Vorbereitung** | Monate bis Tage vorher | „Lohnt sich das, und was muss ich jetzt tun?" | Desktop und Handy, in Ruhe |
| **Vor Ort** | die 5 Tagungstage | „Wo muss ich wann sein — und was kommt als Nächstes?" | Handy, unterwegs, evtl. schlechtes WLAN |
| **Nachlese** | Wochen danach | „Wo finde ich die Fotos, Präsentationen, Kontakte?" | Desktop und Handy, sporadisch |

Die Phase **Vor Ort** ist der Moment, in dem die App eine App sein muss und keine
Website. Sie entscheidet darüber, ob das Produkt als nützlich erlebt wird.

## 4. Nutzergruppen (Annahmen)

- **Teilnehmende Altstipendiat:innen** — die Hauptgruppe. Ein Alumni-Verein umfasst
  ein breites Altersspektrum und damit stark unterschiedliche Technikaffinität und
  Sehfähigkeit. Primärgerät Smartphone; die Anmeldung erfolgt vermutlich häufiger am
  Desktop. *Annahme A1, zu validieren.*
- **Orga-Team / Vorstand** — pflegt Inhalte, beobachtet den Anmeldestand, verschickt
  kurzfristige Ankündigungen. Braucht Verlässlichkeit und Nachvollziehbarkeit, nicht
  Eleganz. Ehrenamtlich, mit begrenzter Zeit und ohne garantierte Git-Kenntnisse.
- **Referent:innen und Gäste** — schmaler Bedarf: der eigene Programmpunkt, Ort, Zeit,
  Ansprechperson, ggf. Hochladen von Präsentationen.

Ein formales Rollen- und Rechtemodell ist **nicht** bestätigt (siehe offene Frage F3).

## 5. Kernjourneys (priorisiert, zu validieren)

| # | Journey | Phase | Warum sie zählt |
|---|---|---|---|
| **J1** | Programm verstehen und persönlich planen | Vorbereitung | Grundlage der Teilnahmeentscheidung |
| **J2** | Verbindlich anmelden inkl. Exkursionswahl mit begrenzten Plätzen | Vorbereitung | Einziger Vorgang mit echter Geschäftslogik und personenbezogenen Daten |
| **J3** | Vor Ort orientieren: „Was läuft jetzt, wo?" | Vor Ort | Häufigste Einzelnutzung während der Tagung |
| **J4** | Kurzfristige Änderungen erfahren | Vor Ort | Raumwechsel, Verspätungen — der klassische Schmerzpunkt jeder Tagung |
| **J5** | Unterkunft aus dem Kontingent finden und buchen | Vorbereitung | Zeitkritisch, Kontingente laufen ab |
| **J6** | Inhalte nachlesen und teilen (Fotos, Präsentationen) | Nachlese | Trägt den Vereinszweck Vernetzung |

J1 bis J4 bilden das Minimum eines nützlichen Produkts. J2 ist die einzige Journey,
die zwingend einen Server erfordert (siehe [ADR-0004](decisions/0004-serverseitige-anmeldung.md)).

## 6. Produktprinzipien

Diese sechs Sätze entscheiden Zweifelsfälle. Sie stehen bewusst in einer Rangfolge.

1. **Verlässlich vor verspielt.** Eine falsche Uhrzeit ist ein Totalschaden, eine
   fehlende Animation nicht. Im Zweifel gewinnt die Korrektheit der Information.
2. **Einmal pflegen, überall korrekt.** Ein einziger Programmstand speist Ansicht,
   PDF-Export und Kalendereintrag. Doppelte Pflege erzeugt garantiert Widersprüche.
3. **Funktioniert auf schlechtem Netz und alten Geräten.** Die Tagungsstätte ist kein
   Rechenzentrum, und das älteste Gerät in der Zielgruppe ist keine Randerscheinung.
4. **Datensparsamkeit ist Gestaltung, nicht Fußnote.** Jedes erhobene Feld muss sich
   gegen die Frage „wofür genau?" verteidigen — vor der Umsetzung, nicht danach.
5. **Bedienbar ohne Erklärung.** Barrierefreiheit ist Mindestanforderung, kein Feature:
   vollständige Tastaturbedienung, sichtbarer Fokus, ausreichende Kontraste.
6. **Wiederverwendbar über Jahrgänge.** 2027 ist die erste Tagung, nicht die einzige.
   Inhalte werden konsequent vom Code getrennt.

## 7. Nicht-Ziele für die erste Version

Bewusst ausgeschlossen, um den Termin zu halten:

- Soziales Netzwerk, Chat, Direktnachrichten, Networking-/Matchmaking-Funktionen
- Zahlungsabwicklung innerhalb der App (Teilnahmebeiträge laufen außerhalb)
- Native Apps in App Store und Play Store
- Mehrsprachigkeit (Deutsch als alleinige Sprache)
- Live-Streaming oder Aufzeichnung von Programmpunkten
- Allgemeine Vereins-/Mitgliederverwaltung über die Tagung hinaus

## 8. Systemgrenzen

Die App **informiert und verweist**, sie ersetzt nicht:

- die **Hotelbuchung** — sie findet beim Hotel statt; die App zeigt Kontingent,
  Stichtag und Buchungsweg
- die **Mitgliederverwaltung** des Vereins
- den **E-Mail-Verkehr** des Orga-Teams — die App ergänzt ihn, ersetzt ihn nicht
  (wichtig für J4: kurzfristige Änderungen dürfen nicht allein in der App stehen)

## 9. Wann ist das Projekt erfolgreich?

Messbar, nach der Tagung auswertbar — Zielwerte erst nach einem Basislauf festlegen:

- Anteil der Anmeldungen, die über die App statt per E-Mail eingehen
- Abbruchquote im Anmeldeformular (Aufruf → abgeschickt)
- Anzahl der Rückfragen ans Orga-Team zu Zeiten, Orten und Kontingenten
- Nutzung während der Tagungstage (Aufrufe der Programmansicht pro Tag)
- Erfolgreiche Bedienung der Kernreisen durch Testpersonen aus dem oberen
  Altersspektrum, ohne Hilfestellung

## 10. Wesentliche Risiken

| Risiko | Wirkung | Erste Gegenmaßnahme |
|---|---|---|
| **Datenschutz bei Fotos** — Bilder von Personen sind personenbezogene Daten; Einwilligung, Widerruf und Löschung sind zu klären | hoch | Rechtsrahmen klären, **bevor** eine Upload-Funktion gebaut wird (F5) |
| **Impressum und Datenschutzerklärung sind Platzhalter** (10 Platzhalter im Entwurf) | hoch | Vor jeder öffentlichen Veröffentlichung durch verbindliche Texte ersetzen |
| **Kontingentlogik bei Gleichzeitigkeit** — „first come, first served" ist ohne Server nicht korrekt abbildbar | hoch | [ADR-0004](decisions/0004-serverseitige-anmeldung.md) |
| **Zwei ehrenamtliche Entwickler, fixer Termin** (rund 7 Monate) | hoch | Enger Scope, Nicht-Ziele einhalten, Betriebsaufwand minimieren |
| **Markenfreigabe** — Farbwerte sind aus dem Vereinslogo abgeleitet, nicht aus offiziellen Markenunterlagen | mittel | Freigabe beim Verein einholen (F7), [ADR-0007](decisions/0007-designsystem.md) |
| **Fehlende Betriebsübergabe** — wer betreibt die App nach der Tagung? | mittel | Betriebsmodell und Nachfolge in einem ADR festhalten |

## 11. Grober Weg dorthin

Reihenfolge, keine Terminzusage. Jede Stufe ist für sich nutzbar.

1. **Fundament** — Projektstruktur, CI, Testgerüst, Designtokens; Inhalte aus dem Code
   lösen. Der bestehende Entwurf bleibt währenddessen die lauffähige Vorschau.
2. **Informieren (J1, J3, J4, J5)** — Programm, Ort, Unterbringung, FAQ, Ankündigungen
   als veröffentlichte, offlinefähige App. Kommt ohne Server und ohne personenbezogene
   Daten aus und kann früh live gehen.
3. **Anmelden (J2)** — serverseitige Anmeldung mit Kontingenten. Erst nach geklärtem
   Datenschutz- und Betriebsrahmen.
4. **Nachlese (J6)** — Fotos und Präsentationen. Erst nach geklärtem Rechtsrahmen.

Stufe 2 ist bewusst so geschnitten, dass sie **ohne Verarbeitung personenbezogener
Daten** auskommt: Sie kann live gehen, während die offenen Rechtsfragen noch laufen.
