# Offene Fragen und Annahmen

**Stand:** 2026-09-26

`AGENTS.md` verlangt: keine erfundenen Geschäftsregeln, Rollen, Zahlungsabläufe,
Datenschutzfristen oder Integrationen. Was nicht bestätigt ist, steht hier — nicht im Code.

**Blockierend** heißt: die genannte Umsetzung darf nicht begonnen werden, bevor die
Frage beantwortet ist.

| # | Frage | Blockiert | Wer klärt |
|---|---|---|---|
| **F1** | Ist eine installierbare Web-App ausreichend, oder werden native Apps in den Stores erwartet? | ADR-0002 | Orga-Team / Vorstand |
| **F2** | Wer betreibt die App, mit welchem Budget, und wer bleibt nach der Tagung verantwortlich? Gibt es Vorgaben des Vereins zu Anbietern oder Auftragsverarbeitung (AVV)? | ADR-0004, Stufe 3 | Vorstand |
| **F3** | Welche Rollen gibt es tatsächlich (Teilnehmend, Orga, Referierend, Gast) und was darf jede davon? Ist die App öffentlich oder nur für Berechtigte? | ADR-0005, Datenmodell | Vorstand |
| **F4** | Welche Felder werden bei der Anmeldung **wirklich** benötigt? Wie lange werden sie aufbewahrt, wer ist Verantwortlicher im Sinne der DSGVO, wie wird gelöscht und Auskunft erteilt? | J2 komplett | Vorstand, ggf. Datenschutzbeauftragte:r |
| **F5** | Fotos: eigenes Album oder externer Dienst? Wie werden Einwilligung, Widerruf und Löschung von Personenbildern geregelt? | J6 komplett | Vorstand |
| **F6** | Gibt es Teilnahmebeiträge, und wie werden sie erhoben? (In der App ist Zahlung Nicht-Ziel — der Ablauf muss trotzdem beschrieben werden.) | Anmeldeabschluss | Orga-Team |
| **F7** | Existieren offizielle Markenunterlagen des ASeV oder der KAS mit verbindlichen Farb-, Schrift- und Logovorgaben? Die aktuellen Werte sind **aus dem Vereinslogo abgeleitet**, nicht freigegeben. | ADR-0007, finales Design | Vorstand |
| **F8** | Wie pflegt das Orga-Team Inhalte? Ist ein Pull Request zumutbar, oder wird eine einfachere Oberfläche gebraucht? | ADR-0006, Folge-ADR CMS | beide Entwickler + Orga-Team |
| **F9** | Über welchen Kanal erreichen kurzfristige Änderungen die Teilnehmenden verlässlich (J4)? E-Mail, Push, Aushang vor Ort — oder mehrere? | J4-Umsetzung | Orga-Team |
| **F10** | Welche Hotelkontingente, Stichtage und Stornoregeln gelten verbindlich? | J5-Inhalte | Orga-Team |
| **F11** | Unter welcher Domain läuft die App, und wer verwaltet sie? | Deployment | Vorstand |
| **F12** | Greift das Barrierefreiheitsstärkungsgesetz (BFSG) für dieses Angebot? Unabhängig davon gilt für uns WCAG 2.2 AA als Eigenanspruch — die Frage betrifft die rechtliche Verbindlichkeit und Dokumentationspflicht. | Erklärung zur Barrierefreiheit | Vorstand, ggf. rechtliche Beratung |
| **F13** | Sollen Daten aus früheren Tagungen oder dem Mitgliederverzeichnis übernommen werden? | Datenmodell | Vorstand |

## Getroffene Annahmen

Diese Annahmen leiten die Arbeit, bis sie bestätigt oder widerlegt sind. Jede ist in
der Umsetzung so zu kapseln, dass eine Widerlegung keine Neuentwicklung erzwingt.

- **A1** — Primärgerät der Teilnehmenden ist das Smartphone; die Anmeldung erfolgt
  häufiger am Desktop.
- **A2** — Das Altersspektrum ist breit; Lesbarkeit und Tastaturbedienbarkeit sind
  keine Randfälle.
- **A3** — Die Inhaltsmenge bleibt überschaubar (eine Tagung, wenige Dutzend
  Programmpunkte) — kein Skalierungsproblem.
- **A4** — Gleichzeitige Last ist gering, mit einer Spitze beim Anmeldestart.
- **A5** — Das Netz in der Tagungsstätte ist unzuverlässig.

## Bekannte Defekte im bestehenden Entwurf

Aus der Durchsicht von `index.html`, unabhängig von den offenen Fragen:

- **Alle Icon-Pfade zeigen ins Leere.** `index.html` und `site.webmanifest` verweisen
  auf `assets/…`, die Dateien liegen aber im Wurzelverzeichnis. Folge: „Zum Homescreen
  hinzufügen" liefert kein App-Icon. Auch `README.md` beschreibt eine `assets/`-Struktur,
  die es nicht gibt.
- **Zwei Logos doppelt ausgeliefert.** 220 KB und 53 KB als Base64 in
  `index.html` eingebettet, obwohl `logo-full.png` daneben liegt — rund 74 % der
  Dateigröße, blockierend vor dem ersten Rendern.
- **Kein sichtbarer Tastaturfokus.** `:focus-visible` kommt nicht vor, obwohl die
  Kacheln der Startseite `<button>`-Elemente sind.
- **Zehn Platzhalter im Text**, darunter Impressum und Datenschutzhinweise.
