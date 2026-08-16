# Jahrestagung 2027 – Web-App (Entwurf)

Dieser Ordner enthält den ersten Entwurf der interaktiven Tagungs-Website, fertig strukturiert für ein **GitHub-Repository inkl. GitHub Pages**. Es sind keine Build-Tools und keine Installation nötig – reines HTML/CSS/JS.

```
├── index.html                  ← die eigentliche Website
├── favicon.ico                 ← Browser-Tab-Icon (aus dem Vereinslogo erzeugt)
├── apple-touch-icon.png        ← Icon für "Zum Homescreen hinzufügen" (iOS)
├── site.webmanifest            ← App-Metadaten (Icons/Name für Mobilgeräte)
├── README.md
└── assets/
    ├── logo-full.png           ← Logo-Lockup (Icon + Schriftzug), auf der Startseite
    ├── logo-icon-192.png       ← quadratisches Icon-Symbol, u. a. im Kopfbereich
    ├── logo-icon-512.png       ← größere Variante fürs Manifest
    ├── favicon-32x32.png
    └── favicon-16x16.png
```

## 1. Schnelltest

Den gesamten Ordner lokal entpacken und `index.html` per Doppelklick öffnen – Bilder/Icons werden nur angezeigt, wenn die `assets/`-Dateien, `favicon.ico` und `apple-touch-icon.png` im selben Ordner bzw. Unterordner liegen wie `index.html`. Daher immer den kompletten Ordner zusammen weitergeben/hochladen, nicht nur die `index.html` allein.

## 2. Veröffentlichung mit GitHub Pages

1. Neues Repository auf GitHub anlegen (z. B. `jahrestagung-2027`).
2. Den kompletten Inhalt dieses Ordners (inkl. `assets/`-Unterordner) in das Repository hochladen – entweder per Drag-and-drop im Browser ("Add file" → "Upload files") oder per `git add . && git commit -m "Erster Entwurf" && git push`.
3. Im Repository zu **Settings → Pages** wechseln, unter „Build and deployment" als Quelle **„Deploy from a branch"** und als Branch **`main` / Ordner `/ (root)`** auswählen, speichern.
4. Nach ein bis zwei Minuten ist die Seite unter `https://<benutzername>.github.io/<repository-name>/` erreichbar.
5. Für eine eigene Domain (z. B. `jahrestagung2027.de`): In den Pages-Einstellungen unter „Custom domain" die Domain eintragen (GitHub legt automatisch eine `CNAME`-Datei im Repo an) und beim Domain-Anbieter einen CNAME- bzw. A-Record auf GitHub Pages setzen (Details dazu in der [GitHub-Dokumentation](https://docs.github.com/de/pages/configuring-a-custom-domain-for-your-github-pages-site)).

Alternativ funktioniert derselbe Ordner unverändert auch bei jedem klassischen Webhoster (per FTP/SFTP hochladen) oder bei Netlify/Vercel (Ordner per Drag-and-drop einspielen).

## 3. Inhalte anpassen

Alle Programm-/Exkursions-/Hotel-/Ankündigungsinhalte befinden sich gut sichtbar am Anfang des `<script>`-Bereichs am Ende von `index.html` (Abschnitt „DATENGRUNDLAGE") sowie direkt im sichtbaren HTML (Begrüßungstext, Sightseeing-Tipps, Kontaktdaten). Auch ohne Programmierkenntnisse lassen sich Texte, Uhrzeiten, Orte und Redner:innen dort direkt ändern.

Farben sind als CSS-Variablen ganz oben im `<style>`-Bereich hinterlegt (`--kas-blue` usw.). Blau, Orange und Grün wurden direkt aus dem mitgelieferten Vereinslogo übernommen; Pink, Türkis, Violett und Rot sind dazu passend ausgesuchte Ergänzungsfarben ohne Vorlage im Logo und können bei Bedarf angepasst werden.

## 4. Logo & Icons austauschen

Alle Icon-Dateien (`favicon.ico`, `apple-touch-icon.png`, `assets/favicon-*.png`, `assets/logo-icon-*.png`) wurden automatisch aus dem hochgeladenen Vereinslogo zugeschnitten. Soll ein anderes/aktualisiertes Logo verwendet werden, genügt es, ein neues Logo bereitzustellen – wir erzeugen daraus dieselben Dateien neu.

## 5. Wichtig: Anmeldung & Exkursions-Kontingente

Der Entwurf zeigt die komplette Anmeldelogik inkl. Kontingent-Anzeige ("first come, first served") **funktionsfähig im Browser** – ideal, um Ablauf und Design jetzt schon zu testen. Diese Testversion speichert Anmeldungen nur im Arbeitsspeicher der jeweils geöffneten Browser-Sitzung (bewusst kein `localStorage`, da nicht zwischen verschiedenen Besucher:innen geteilt).

**Für den echten Betrieb mit vielen gleichzeitigen Teilnehmenden wird zusätzlich ein Backend benötigt**, das die Anmeldungen zentral speichert und die Kontingente über alle Nutzer:innen hinweg korrekt zählt. Eine reine HTML-Datei allein kann das nicht leisten. Praktikable, schnell umsetzbare Optionen:

- **Google Formular + Google Sheet** (mit Apps-Script-Automatisierung, die pro Exkursion mitzählt und ab Erreichen des Kontingents automatisch sperrt)
- **Airtable oder Tally** mit Automatisierung/Limit je Auswahlfeld
- **Kleines eigenes Backend** (z. B. Cloudflare Workers + D1/KV, oder Supabase/Firebase) – dafür ist im Code (`submitRegistration()`) bereits markiert, an welcher Stelle ein `fetch(...)`-Aufruf an eine eigene API ergänzt werden müsste

Wir unterstützen gerne bei der Anbindung, sobald die technische Richtung feststeht.

## 6. Rechtliches (vor Veröffentlichung unbedingt ergänzen)

- **Impressum** (§ 5 TMG) – aktuell nur Platzhalter
- **Datenschutzerklärung** (DSGVO) – aktuell nur Platzhalter, insbesondere zur Verarbeitung der Anmeldedaten

Beide Platzhalter sind über die Fußzeile der Website erreichbar und müssen vor dem Livegang durch geprüfte Rechtstexte ersetzt werden.

## 7. Unterbringung & Ankündigungen pflegen

- **Unterbringung**: Hotelkontingente stehen im Array `HOTELS` im `<script>`-Bereich. Ein weiteres Hotel hinzufügen = ein weiteres Objekt nach demselben Muster in die eckigen Klammern kopieren.
- **Ankündigungen**: Meldungen stehen im Array `ANNOUNCEMENTS`. Neuer Eintrag = `{ date: "JJJJ-MM-TT", title: "...", text: "...", priority: "info" }` (oder `"important"` für rote Hervorhebung) ergänzen. Einträge der letzten 14 Tage erhalten automatisch ein „NEU“-Label, auch auf der Startkachel.
- Beide Bereiche sind reine Textdaten in der Datei – jede Änderung erfordert ein erneutes Hochladen der `index.html`. Für spontane Redaktion durch mehrere Personen ohne technischen Reupload wäre – wie bei der Anmeldung – ein kleines Backend/CMS (oder z. B. ein eingebundenes Google Sheet) die praktikablere Lösung auf Dauer.

## 8. Offene Punkte aus der Excel-Vorlage

- Die Excel-Tabelle listet aktuell **9 Exkursionsplätze** für Freitagnachmittag (4 bereits benannt: Dom/Michaeliskirche, Hof Riepl-Bauer, Stadtführungen Hildesheim, NDR Landesfunkhaus Hannover; 5 als Platzhalter „Exkursion 5–9"). In der Aufgabenstellung war von 8 Exkursionen die Rede – bitte final abgleichen.
- Kontingent je Exkursion ist aktuell einheitlich auf 50 gesetzt (Platzhalter, in `EXCURSIONS` im Code leicht anpassbar).
- Redner:innen-Angaben für Freitag ("Tilman Kuban, Dr. Israng") und Samstag ("Norbert Lammert") stammen unverändert aus der Excel-Tabelle bzw. mit korrigiertem Tippfehler (Vorname) und sind laut Tabelle teils noch unbestätigt.
- Studium Generale am Samstag: 16 Slots (4 Zeitfenster × 4 Räume) sind als Platzhalter-Raster angelegt, Themen fehlen noch komplett.
- Kontaktdaten Orga-Team, Hotel-Adresse sowie Sightseeing-/Restaurant-Tipps sind Entwürfe und sollten vom Orga-Team final geprüft/ersetzt werden.
