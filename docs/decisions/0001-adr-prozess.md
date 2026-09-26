# ADR-0001: ADR-Prozess und Dokumentationsstruktur

- **Status:** Angenommen
- **Datum:** 2026-09-26
- **Bezug:** `AGENTS.md`, Abschnitte „Zusammenarbeit und Rollen" sowie „Technische Architektur"

## Kontext

`AGENTS.md` verlangt, wichtige Entscheidungen und abgelehnte Alternativen knapp in
`docs/decisions/` festzuhalten und wesentliche Architekturentscheidungen als ADR mit
Kontext, Entscheidung und Konsequenzen zu dokumentieren. Bisher existierte kein Ordner,
kein Format und keine Reihenfolge. Zwei Menschen und wechselnde Coding-Agenten arbeiten
an derselben Codebasis: ohne festgehaltenes „warum" wird jede Entscheidung bei der
nächsten Gelegenheit neu verhandelt — besonders von Agenten, die den früheren Verlauf
nicht kennen.

## Entscheidung

Architekturentscheidungen werden als nummerierte Markdown-Dateien in `docs/decisions/`
festgehalten, im Format von `0000-vorlage.md` (Kontext, Entscheidung, Konsequenzen,
verworfene Alternativen, offene Punkte). Angenommene ADRs werden nicht überschrieben,
sondern durch neue ADRs abgelöst. Daneben führen wir `docs/vision.md` als Zielbild und
`docs/offene-fragen.md` als Register ungeklärter Annahmen.

## Konsequenzen

**Positiv:** Jede Entscheidung ist mit ihrer Begründung auffindbar. Coding-Agenten
erhalten belastbaren Kontext, statt ihn zu erraten. Der Abschnitt „verworfene
Alternativen" verhindert Wiederholungsdebatten. Der Reviewzwang aus `AGENTS.md` greift
auch für Entscheidungen, nicht nur für Code.

**Negativ:** Laufender Pflegeaufwand. Veraltete ADRs sind schlimmer als keine, deshalb
gehört die Statuspflege in die Definition of Done. Bei zwei Entwicklern besteht die
Gefahr, den Prozess schwerer zu machen als das Projekt — ADRs bleiben deshalb kurz und
entstehen nur für Entscheidungen mit Langzeitwirkung.

## Verworfene Alternativen

- **Entscheidungen im Wiki oder in Issues.** Nicht versioniert mit dem Code, nicht im
  Arbeitsverzeichnis der Agenten, geht bei Werkzeugwechsel verloren.
- **Alles in `AGENTS.md`.** Die Datei beschreibt Arbeitsweise, nicht Architektur; sie
  würde unlesbar und verlöre die Historie einzelner Entscheidungen.
- **Vollständiges MADR mit Bewertungsmatrix.** Für ein Zwei-Personen-Ehrenamtsprojekt
  unverhältnismäßig.

## Offene Punkte

Keine.
