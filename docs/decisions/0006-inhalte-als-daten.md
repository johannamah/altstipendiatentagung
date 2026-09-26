# ADR-0006: Tagungsinhalte als versionierte Daten, nicht im Code

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** offene Frage F8; ADR-0003; Produktprinzipien 2 und 6

## Kontext

Programm, FAQ, Hotelliste, Exkursionen, Kontaktpersonen und Stadttipps stecken derzeit
als JavaScript-Literale in `index.html`. Folgen:

- Eine Programmänderung ist eine Codeänderung — mit Review und Deployment, aber ohne
  jede Prüfung, ob die Daten überhaupt schlüssig sind (fehlende Uhrzeit, Exkursion ohne
  Kapazität, Programmpunkt am falschen Tag).
- Das PDF wird aus denselben Literalen erzeugt. Solange das so bleibt, ist Prinzip 2
  („einmal pflegen, überall korrekt") zufällig erfüllt statt strukturell.
- Für die Tagung 2028 müsste der Code auseinandergenommen werden, um die Inhalte von
  2027 zu entfernen. Prinzip 6 verlangt das Gegenteil.

## Entscheidung

Tagungsinhalte werden als strukturierte, schemavalidierte Daten getrennt vom Code
geführt (in Astro als Content Collections, Markdown mit Frontmatter für Fließtexte,
strukturierte Daten für Programm, Exkursionen und Hotels). Jede Inhaltsart erhält ein
Schema; der Build bricht ab, wenn Daten es verletzen. Ein Tagungsjahrgang ist ein
abgegrenzter Datensatz. Programm-Ansicht, PDF-Export und Kalendereintrag werden
**ausschließlich** aus diesen Daten erzeugt.

## Konsequenzen

**Positiv:** Prinzip 2 ist strukturell abgesichert, nicht nur beabsichtigt. Inhaltliche
Fehler werden im Build gefunden statt von Teilnehmenden vor dem falschen Raum.
Inhaltsänderungen sind im Pull Request lesbar — man sieht, dass ein Vortrag von 14:00
auf 15:00 gewandert ist, statt einen Diff mitten im Skript zu entziffern. Die Tagung
2028 beginnt mit einem neuen Datensatz statt mit Codechirurgie. Inhalt und Code können
von verschiedenen Personen parallel bearbeitet werden.

**Negativ:** Schemata müssen entworfen und gepflegt werden — zu streng behindern sie,
zu locker nützen sie nichts. Inhaltspflege setzt weiterhin Git voraus; für das
Orga-Team ist das womöglich nicht zumutbar (F8). Bis das geklärt ist, bleiben
Änderungen an uns beiden hängen — ein Engpass genau in den Tagen vor der Tagung, in
denen sich am meisten ändert.

## Verworfene Alternativen

- **Alles im Code lassen.** Verstößt gegen Prinzip 6 und lässt inhaltliche Fehler
  ungeprüft.
- **Ein gehostetes CMS (WordPress, Contentful, Strapi).** Zusätzliche Laufzeitkomponente
  plus laufende Kosten und Wartung, für eine Handvoll Programmpunkte unverhältnismäßig.
- **Google Sheets als Inhaltsquelle.** Vertraut fürs Orga-Team, aber Datenabfluss an
  Dritte, keine Versionierung im Repository, keine Reviewpflicht, keine Schemaprüfung.
- **Git-basiertes CMS mit Weboberfläche (Decap, Sveltia).** Fachlich der plausible
  nächste Schritt, wenn F8 „Git ist nicht zumutbar" ergibt. Bewusst zurückgestellt, bis
  der Bedarf belegt ist, statt Infrastruktur auf Verdacht einzuführen.

## Offene Punkte

- **F8** — Zumutbarkeit von Pull Requests für das Orga-Team. Bei negativer Antwort folgt
  ein ADR zu einem Git-basierten Redaktionswerkzeug.
- Zuschnitt der Schemata je Inhaltsart, inklusive Umgang mit unfertigen Inhalten
  (aktuell zehn Platzhalter, darunter Impressum und Datenschutzhinweise) — der Build
  sollte eine Veröffentlichung mit Platzhaltern in rechtlich relevanten Bereichen
  verhindern.
