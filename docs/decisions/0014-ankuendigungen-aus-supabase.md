# ADR-0014: Ankündigungen aus einer Supabase-Datenbank

- **Status:** Vorgeschlagen
- **Datum:** 2026-11-22
- **Beteiligt:** beide Entwickler
- **Bezug:** F2, F8, F9; ADR-0002, ADR-0006, ADR-0013

## Kontext

Ankündigungen standen bisher als `src/content/ankuendigungen.json` im Repository
(ADR-0006). Jede Änderung brauchte einen Pull Request, ein Review und ein
Deployment. Für kurzfristige Änderungen während der Tagung, etwa eine
Raumänderung am Morgen, ist das zu langsam.

Der Verein hat entschieden, dafür eine Datenbank bei Supabase zu nutzen. Die übrige
App bleibt statisch (ADR-0013).

## Entscheidung

1. **Tabelle `public.ankuendigungen`** mit Titel, Text, Gewicht (`info` oder
   `wichtig`), Sichtbarkeit und Veröffentlichungszeitpunkt. Die Struktur steht als
   Migration in `supabase/migrations/`.
2. **Lesen:** Der Browser fragt die REST-Schnittstelle von Supabase direkt ab, mit dem
   veröffentlichbaren Schlüssel und ohne Supabase-SDK. Row Level Security lässt nur
   Zeilen mit `sichtbar = true` durch.
3. **Schreiben:** Über die Schnittstelle gar nicht. `anon` und `authenticated` haben
   nur `select`. Ankündigungen entstehen im Supabase-Dashboard (Table Editor). Neue
   Einträge sind zunächst unsichtbar und werden bewusst sichtbar geschaltet.
4. **Offline:** Die zuletzt geladenen Ankündigungen liegen im `localStorage` des
   Geräts. Ohne Netz zeigt die Seite diese Kopie mit ihrem Stand.
5. **Konfiguration:** `PUBLIC_SUPABASE_URL` und `PUBLIC_SUPABASE_KEY` kommen beim
   Bauen aus der Umgebung (Vercel). Fehlen sie, meldet die Seite „noch nicht
   verbunden".

## Konsequenzen

**Positiv:** Eine Ankündigung ist ohne Deployment auf allen Geräten, sobald sie die
Seite neu laden. Die Schreibrechte liegen nicht im Browser, ein Fehler in der App
kann also nichts in die Datenbank schreiben. Das Bundle bleibt klein, weil es kein
SDK gibt.

**Negativ:**

- Ein weiterer Dienstleister, der die IP-Adressen der Besucher sieht (Supabase Inc.,
  USA). Das gehört in die Datenschutzerklärung, die Region der Datenbank und die
  Auftragsverarbeitung muss der Vorstand klären.
- **Wer im Dashboard schreibt, hat weitreichende Rechte** auf das ganze Projekt, je
  nach Rolle bis zum Löschen. Deshalb nur wenige Personen; es gibt keine
  Freigabe durch eine zweite Person und keine Änderungshistorie.
- Im kostenfreien Tarif pausiert Supabase Projekte nach längerer Inaktivität. Dann
  zeigt die App nur noch die Kopie oder eine Fehlermeldung, bis jemand das Projekt
  im Dashboard wieder startet.
- Ankündigungen sind nicht mehr im Repository versioniert und nicht mehr Teil der
  Reviews. Für Ankündigungen weicht das von ADR-0006 ab.
- Die Seite braucht JavaScript, um Ankündigungen zu zeigen.

## Verworfene Alternativen

- **JSON im Repository (bisher).** Versioniert und reviewt, aber zu langsam für
  kurzfristige Änderungen.
- **Abruf beim Bauen statt im Browser.** Kein JavaScript nötig, aber jede Änderung
  bräuchte wieder ein Deployment.
- **Supabase-SDK (`@supabase/supabase-js`).** Bequemer, aber für eine einzige
  lesende Abfrage ein Vielfaches an Code auf jedem Smartphone.
- **Eigene Pflegeoberfläche mit Supabase Auth.** Würde Schreibrechte fein begrenzen,
  setzt aber geklärte Rollen voraus (F3, F8) und ist ein eigenes Vorhaben.
- **Echtzeit-Updates (Supabase Realtime).** Hält eine dauerhafte Verbindung offen,
  was Akku und Datenvolumen kostet. Neu laden genügt.

## Offene Punkte

- **F8:** Wer schreibt Ankündigungen? Bekommt das Orga-Team Zugang zum Dashboard
  (mit welcher Rolle), oder schickt es Texte an die Entwickler?
- Region des Supabase-Projekts. Empfehlung: Frankfurt (`eu-central-1`).
- Tarif und Pausieren bei Inaktivität. Spätestens zur Tagung muss das Projekt
  zuverlässig laufen (F2).
- **F9:** Ob zusätzlich ein aktiver Hinweis nötig ist, etwa auf der Startseite oder
  per E-Mail. Neu ist bisher nur, dass die Ankündigungen-Seite ohne Deployment
  aktuell ist.
