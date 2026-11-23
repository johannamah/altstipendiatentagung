# ADR-0011: Anmeldung über Microsoft Forms des Vereins

- **Status:** Angenommen
- **Datum:** 2026-10-17
- **Beteiligt:** Orga-Team
- **Bezug:** ADR-0004 (vorerst zurückgestellt), ADR-0009; offene Fragen F2, F4

## Kontext

ADR-0004 sieht für Anmeldung und Exkursionskontingente einen eigenen Serverdienst mit
Datenbank vor. Dessen Betriebsmodell hängt an F2 (Betreiber, Budget, AVV), und F4
(Felder, Fristen, Löschkonzept) ist ebenfalls offen. Beides ist bis zur Öffnung der
Anmeldung nicht absehbar geklärt.

Das Orga-Team hat inzwischen ein Anmeldeformular in Microsoft Forms auf dem
Microsoft-365-Konto des Vereins angelegt. Der Verein nutzt Microsoft 365 bereits für
die Fotos (ADR-0009).

## Entscheidung

Die Kachel „Anmeldung“ führt direkt auf das Formular in Microsoft Forms und öffnet es in
einem neuen Tab. Die App selbst nimmt keine Anmeldedaten entgegen; die Seite
`/anmeldung` entfällt.

## Konsequenzen

**Positiv:** Die Anmeldung kann öffnen, ohne dass wir einen Server betreiben. Kein neuer
Auftragsverarbeiter, die Daten liegen in der bestehenden Umgebung des Vereins. Die App
verarbeitet weiterhin keine personenbezogenen Daten.

**Negativ:** Microsoft Forms kennt keine Platzkontingente je Antwortoption. Die
Exkursionsplätze nach „first come, first served“ sind damit **nicht technisch
abgesichert**; das Orga-Team muss Überbuchungen von Hand erkennen und auflösen — genau
der Fall, den ADR-0004 vermeiden wollte. Wer die Kachel antippt, verlässt die App; die
Unterzeile kündigt das an. Die Übersicht der Exkursionen mit Platzzahlen, die bisher
auf `/anmeldung` stand, entfällt; die Beschreibungen bleiben im Programm.

F4 bleibt bestehen: Auch im Formular braucht es einen Hinweis zu Verantwortlichem,
Zweck und Löschfrist.

## Verworfene Alternativen

- **Zwischenseite in der App mit Knopf zum Formular.** Hätte die Exkursionsübersicht
  erhalten, kostet aber einen Klick mehr; gewünscht ist die direkte Weiterleitung.
- **Formular im selben Tab öffnen.** Wer zurück will, landet je nach Gerät nicht wieder
  in der App — besonders bei der installierten App.
- **Eigener Serverdienst nach ADR-0004.** Bleibt die bessere Lösung für Kontingente,
  ist aber nicht rechtzeitig verfügbar.

## Offene Punkte

- Wie werden Exkursionskontingente im Formular gesteuert (z. B. Option manuell
  entfernen, sobald sie voll ist)? Das FAQ beschreibt die Auswahl noch so, als sei sie
  technisch begrenzt.
- ADR-0004 wird wieder relevant, sobald F2 geklärt ist oder die Handarbeit zu groß wird.
