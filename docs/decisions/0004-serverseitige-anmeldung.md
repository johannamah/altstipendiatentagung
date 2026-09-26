# ADR-0004: Anmeldung und Kontingente serverseitig

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** offene Fragen F2, F4; Journey J2; ADR-0005

## Kontext

Die Anmeldung vergibt begrenzte Exkursionsplätze nach „first come, first served". Im
bestehenden Entwurf läuft das vollständig im Browser; die Datei sagt das im eigenen
Hinweistext selbst: Speicherung nur im Arbeitsspeicher der laufenden Sitzung.

Zwei Browser, die gleichzeitig den letzten Platz belegen, bekommen beide eine Zusage.
Eine Kapazitätsprüfung, die auf dem Gerät der Nutzenden stattfindet, ist zudem
beliebig manipulierbar. `AGENTS.md` verlangt ausdrücklich, Eingaben serverseitig
abzusichern. Produktprinzip 1 („verlässlich vor verspielt") macht eine doppelt
vergebene Zusage zu einem Totalschaden — der Fehler fällt erst vor Ort auf.

Gleichzeitig gilt: Anmeldedaten sind personenbezogene Daten. Ohne geklärten
Verantwortlichen, Zweck, Aufbewahrungsfrist und Löschkonzept (F4) darf davon nichts
produktiv laufen.

## Entscheidung

Anmeldung und Kontingentvergabe werden serverseitig umgesetzt. Die Platzvergabe erfolgt
in einer einzigen Datenbanktransaktion, die die Kapazität prüft und den Platz belegt;
der Browser zeigt das Ergebnis an, entscheidet es aber nicht. Die Daten liegen in einer
relationalen, PostgreSQL-kompatiblen Datenbank in der EU.

Das konkrete Betriebsmodell (eigener Server, Serverless-Dienst oder Managed-Anbieter)
ist **noch nicht entschieden** und wird in einem eigenen ADR festgehalten, sobald F2
beantwortet ist.

## Konsequenzen

**Positiv:** Kontingente werden korrekt vergeben, auch bei gleichzeitigen Zugriffen.
Anmeldungen überleben einen Browserneustart. Das Orga-Team erhält einen belastbaren
Anmeldestand. Serverseitige Validierung wird überhaupt erst möglich.

**Negativ:** Das Projekt bekommt eine Laufzeitkomponente mehr, die betrieben,
aktualisiert, gesichert und bezahlt werden muss — dauerhaft, auch nach der Tagung.
Reines Hosting auf GitHub Pages genügt nicht mehr. Ab diesem Punkt verarbeiten wir
personenbezogene Daten: Datenschutzerklärung, Löschkonzept, Auskunftsfähigkeit,
Zugriffsbeschränkung und Sicherungen sind Voraussetzung, nicht Nacharbeit. Dazu kommen
Missbrauchsschutz (Rate-Limiting, Spam) und die Frage, wer im Störungsfall erreichbar ist.

**Deshalb** ist Stufe 2 der Vision („Informieren") bewusst so geschnitten, dass sie ohne
Server und ohne personenbezogene Daten live gehen kann.

## Verworfene Alternativen

- **Anmeldung per E-Mail-Formular ohne Datenbank.** Einfach und schnell, aber die
  Kontingentprüfung landet in der Handarbeit des Orga-Teams — fehleranfällig und genau
  der Aufwand, den die App abnehmen soll. Bleibt jedoch die **Rückfallebene**, falls
  F2/F4 nicht rechtzeitig geklärt werden.
- **Externer Dienst (z. B. Formularanbieter, Eventbrite).** Schnell verfügbar, aber
  Datenabfluss an Dritte, Abhängigkeit, meist kein passendes Kontingentmodell pro
  Exkursion, und die Marken- und Gestaltungsführung geht verloren.
- **Alles im Browser belassen und auf Ehrlichkeit vertrauen.** Nicht vertretbar bei
  verbindlichen Anmeldungen.

## Offene Punkte

- **F2** — Betreiber, Budget, Anbietervorgaben, Auftragsverarbeitungsvertrag. Blockiert
  die Wahl des Betriebsmodells.
- **F4** — benötigte Felder, Aufbewahrungsfristen, Verantwortlicher, Löschkonzept.
  Blockiert das Datenmodell und jede produktive Nutzung.
- **F6** — Teilnahmebeiträge: Der Ablauf muss beschrieben sein, auch wenn die Zahlung
  außerhalb der App stattfindet.
