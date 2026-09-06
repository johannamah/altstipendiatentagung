# Jahrestagung 2027 – Web-App (Entwurf)

Dieser Ordner enthält den Entwurf der interaktiven Tagungs-Website, fertig strukturiert für ein **GitHub-Repository inkl. GitHub Pages**. Es sind keine Build-Tools und keine Installation nötig – reines HTML/CSS/JS.

```
├── index.html                  ← die eigentliche Website (voll eigenständig, s. u.)
├── favicon.ico                 ← Browser-Tab-Icon (aus dem Vereinslogo erzeugt)
├── apple-touch-icon.png        ← Icon für "Zum Homescreen hinzufügen" (iOS)
├── site.webmanifest            ← App-Metadaten (Icons/Name für Mobilgeräte)
├── README.md
└── assets/
    ├── logo-full.png           ← Logo-Lockup (Icon + Schriftzug) – Rohdatei, falls benötigt
    ├── logo-icon-192.png       ← quadratisches Icon-Symbol – Rohdatei, falls benötigt
    ├── logo-icon-512.png       ← größere Variante fürs Manifest
    ├── favicon-32x32.png
    └── favicon-16x16.png
```

**Wichtig zu den Bildern:** Das Vereinslogo (Kopfbereich und Startseite) ist direkt in `index.html` eingebettet (als Base64-Daten), damit die Datei auch **einzeln** – ganz ohne den `assets/`-Ordner – funktioniert und die Logos nirgends als kaputtes Bild-Symbol/Fragezeichen erscheinen. Der `assets/`-Ordner wird trotzdem für GitHub Pages mitgeliefert, da `site.webmanifest` (App-Icons fürs Smartphone) weiterhin darauf verweist.

## 1. Schnelltest

Den gesamten Ordner lokal entpacken und `index.html` per Doppelklick öffnen. Da die Logos eingebettet sind, funktioniert `index.html` sogar als einzelne Datei; für den Live-Betrieb (Browser-Tab-Icon, "Zum Homescreen hinzufügen") sollte trotzdem immer der komplette Ordner hochgeladen werden.

## 2. Veröffentlichung mit GitHub Pages

1. Neues Repository auf GitHub anlegen (z. B. `jahrestagung-2027`).
2. Den kompletten Inhalt dieses Ordners (inkl. `assets/`-Unterordner) in das Repository hochladen – entweder per Drag-and-drop im Browser ("Add file" → "Upload files") oder per `git add . && git commit -m "Erster Entwurf" && git push`.
3. Im Repository zu **Settings → Pages** wechseln, unter „Build and deployment" als Quelle **„Deploy from a branch"** und als Branch **`main` / Ordner `/ (root)`** auswählen, speichern.
4. Nach ein bis zwei Minuten ist die Seite unter `https://<benutzername>.github.io/<repository-name>/` erreichbar.
5. Für eine eigene Domain (z. B. `jahrestagung2027.de`): In den Pages-Einstellungen unter „Custom domain" die Domain eintragen (GitHub legt automatisch eine `CNAME`-Datei im Repo an) und beim Domain-Anbieter einen CNAME- bzw. A-Record auf GitHub Pages setzen (Details dazu in der [GitHub-Dokumentation](https://docs.github.com/de/pages/configuring-a-custom-domain-for-your-github-pages-site)).

Alternativ funktioniert derselbe Ordner unverändert auch bei jedem klassischen Webhoster (per FTP/SFTP hochladen) oder bei Netlify/Vercel (Ordner per Drag-and-drop einspielen).

## 3. Inhalte anpassen

Alle Programm-/Exkursions-/Hotel-/Ankündigungsinhalte befinden sich gut sichtbar am Anfang des `<script>`-Bereichs am Ende von `index.html` (Abschnitt „DATENGRUNDLAGE") sowie direkt im sichtbaren HTML (Begrüßungstext, Sightseeing-Tipps, Kontaktdaten). Auch ohne Programmierkenntnisse lassen sich Texte, Uhrzeiten, Orte und Redner:innen dort direkt ändern.

Farben sind als CSS-Variablen ganz oben im `<style>`-Bereich hinterlegt (`--kas-blue` usw.). Blau, Orange und Grün wurden direkt aus dem mitgelieferten Vereinslogo übernommen; Pink, Türkis, Violett, Rot, Gold und Braun sind dazu passend ausgesuchte Ergänzungsfarben ohne Vorlage im Logo und können bei Bedarf angepasst werden.

## 3a. Direktlinks auf einzelne Ansichten

Jede Ansicht hat eine eigene Adresse. Damit funktionieren der Zurück-Button des Browsers und die Wischgeste zurück, und einzelne Seiten lassen sich gezielt verlinken (z. B. in einer Rundmail „hier geht es direkt zur Anmeldung"):

| Ansicht | Adresse |
|---|---|
| Startseite | `.../index.html` |
| Ankündigungen | `.../index.html#/ankuendigungen` |
| Begrüßungsworte | `.../index.html#/begruessung` |
| Programm | `.../index.html#/programm` |
| Anmeldung | `.../index.html#/anmeldung` |
| Unterbringung | `.../index.html#/unterbringung` |
| Fotos | `.../index.html#/fotos` |
| Hildesheim & Umgebung | `.../index.html#/hildesheim` |
| FAQ | `.../index.html#/faq` |
| Kontakt & Orga-Team | `.../index.html#/kontakt` |

Eine unbekannte Adresse führt automatisch zurück auf die Startseite. Die Zuordnung steht im `<script>`-Bereich im Abschnitt `ROUTES` und kann dort angepasst werden.

## 3b. Helle und dunkle Darstellung

Oben rechts in der Kopfleiste schaltet ein Knopf die Darstellung um – im Wechsel **Automatisch → Hell → Dunkel → Automatisch**. „Automatisch" folgt der Systemeinstellung des jeweiligen Geräts (Hell-/Dunkelmodus von Windows, macOS, iOS, Android). Die Auswahl wird lokal im Browser gespeichert und gilt nur für dieses Gerät.

Die Farben liegen als CSS-Variablen im `<style>`-Bereich:

- **Helle Darstellung**: Block `:root` ganz oben.
- **Dunkle Darstellung**: Block „Dunkle Palette" direkt darunter, alle Werte mit dem Präfix `--d-`. **Nur dort ändern** – die beiden Regelblöcke weiter unten weisen die Werte lediglich zu, damit Automatik und Handschalter nicht auseinanderlaufen können.

Wer Farben anpasst, sollte den Kontrast prüfen (Text zu Hintergrund mindestens 4,5:1). Aus demselben Grund ist die Schriftfarbe der „TBD"-Markierung bewusst ein dunkleres Orange als die übrige Akzentfarbe.

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

- **Unterbringung**: Hotels mit eigenem Zimmerkontingent stehen im Array `HOTELS`, reine Übernachtungsempfehlungen ohne Kontingent im Array `HOTEL_RECOMMENDATIONS` (beide im `<script>`-Bereich). Ein weiteres Hotel hinzufügen = ein weiteres Objekt nach demselben Muster in die passenden eckigen Klammern kopieren.
- **Ankündigungen**: Meldungen stehen im Array `ANNOUNCEMENTS`. Neuer Eintrag = `{ date: "JJJJ-MM-TT", title: "...", text: "...", priority: "info" }` (oder `"important"` für rote Hervorhebung) ergänzen. Einträge der letzten 14 Tage erhalten automatisch ein „NEU“-Label, auch auf der Startkachel.
- Beide Bereiche sind reine Textdaten in der Datei – jede Änderung erfordert ein erneutes Hochladen der `index.html`. Für spontane Redaktion durch mehrere Personen ohne technischen Reupload wäre – wie bei der Anmeldung – ein kleines Backend/CMS (oder z. B. ein eingebundenes Google Sheet) die praktikablere Lösung auf Dauer.

## 8. Offene Punkte aus der Excel-Vorlage

- Die Excel-Tabelle listet aktuell **9 Exkursionsplätze** für Freitagnachmittag (4 bereits benannt: Dom/Michaeliskirche, Hof Riepl-Bauer, Stadtführungen Hildesheim, NDR Landesfunkhaus Hannover; 5 als Platzhalter „Exkursion 5–9"). In der Aufgabenstellung war von 8 Exkursionen die Rede – bitte final abgleichen.
- Kontingent je Exkursion ist aktuell einheitlich auf 50 gesetzt (Platzhalter, in `EXCURSIONS` im Code leicht anpassbar). Die Anzahl freier Plätze wird bewusst **nur noch im Anmeldeformular** angezeigt, nicht mehr in der Programmübersicht (dort erscheinen die Exkursionen als einfache, antippbare Liste mit Detailansicht).
- Redner:innen-Angaben für Freitag ("Tilman Kuban, Dr. Israng") und Samstag ("Norbert Lammert") stammen unverändert aus der Excel-Tabelle bzw. mit korrigiertem Tippfehler (Vorname) und sind laut Tabelle teils noch unbestätigt.
- Studium Generale am Samstag: 16 Slots (4 Zeitfenster × 4 Räume) sind als Platzhalter-Raster angelegt, Themen fehlen noch komplett.
- Zu jeder Exkursion (Array `EXCURSIONS`) gibt es jetzt zusätzliche Detailfelder – `treffpunkt`, `verantwortlicher`, `verantwortlicherTelefon`, `zeitrahmen`, `anreise`, `info` –, die beim Antippen einer Exkursion in einem Detailfenster angezeigt werden. Bis auf die vier bereits benannten Exkursionen (mit kurzem inhaltlichen Info-Text) sind diese Felder noch **Platzhalter** (`[... einfügen]`) und müssen vom Orga-Team final befüllt werden.
- Kontaktdaten Orga-Team (siehe Punkt 9) sowie Sightseeing-/Restaurant-Tipps sind Entwürfe und sollten vom Orga-Team final geprüft/ersetzt werden.

## 9. Kontakt & Orga-Team, FAQ, Fotos, PDF-Download, Hintergrundbild

- **Kontakt & Orga-Team**: Das Array `CONTACTS` enthält die acht genannten Personen (Torben Burdorf, Konstantin Gerbrich, Pia Gerbrich, Marvin Pawelczyk, Johanna Mahler, Sven Lüdiger, Ferdinand Meißner, Brit Fillies). Telefonnummer, E-Mail und Zuständigkeitsbereich sind bewusst als Platzhalter angelegt (`[... einfügen]`) und sollten von jeder Person selbst bzw. vom Orga-Team ergänzt werden.
- **FAQ**: Eigene Kachel "FAQ" mit aufklappbaren Fragen/Antworten, Inhalte im Array `FAQ` im Skript-Bereich – weitere Einträge lassen sich dort einfach ergänzen.
- **Fotos**: Eigene Kachel "Fotos" mit einem Link zu einem gemeinsamen Fotoalbum (Variable `PHOTO_ALBUM_URL`). Eine reine HTML-Datei kann selbst keinen Foto-Upload/-Speicher bereitstellen – hierfür bitte einen externen, gemeinsam nutzbaren Dienst einrichten und den Link eintragen, z. B. ein geteiltes Google-Fotos-Album, eine Nextcloud-Freigabe oder ein Tool wie Padlet (dort können Teilnehmende auch ohne eigenen Account Fotos hochladen und die der anderen ansehen). Bitte vorab kommunizieren, dass das Hochladen als Einverständnis zur gemeinsamen Nutzung der Fotos gilt.
- **Programm als PDF**: Über den Button "Programm als PDF herunterladen" in der Programm-Kachel wird das PDF **direkt im Browser, live aus den aktuellen Daten** (Programm, Exkursionsdetails, Unterbringung, Kontakt) erzeugt (Bibliotheken jsPDF + jspdf-autotable, eingebunden über cdnjs). Jede erzeugte PDF-Datei zeigt oben und in der Fußzeile ein "Stand: TT.MM.JJJJ, HH:MM Uhr" – da die Erzeugung bei jedem Klick frisch aus dem aktuellen Code-Stand erfolgt, ist nach jeder inhaltlichen Änderung an der Website automatisch auch das PDF aktuell (kein separat gepflegtes PDF nötig). Voraussetzung: Der Rechner braucht beim Klick eine Internetverbindung, damit die beiden Bibliotheken von cdnjs.cloudflare.com geladen werden können.
- **Hintergrundbild Hildesheim**: Für den gewünschten Hintergrund mit einem Bild von Hildesheim konnte über die uns zur Verfügung stehenden Recherchewege kein lizenzfreies bzw. -geklärtes Foto beschafft werden. Stattdessen wurde eine **eigene, dezente Skyline-Illustration** (abstrahierte Silhouette mit Turmformen, in KAS-Blau, sehr blass) als Hintergrund hinterlegt – erkennbar an den Bildrändern, besonders am unteren Seitenrand. Wer ein eigenes, freigegebenes Hildesheim-Foto zur Verfügung stellt, kann es unkompliziert stattdessen einsetzen: einfach die CSS-Variable `--skyline-svg` bzw. `background-image` in der Regel `.bg-layer` (im `<style>`-Bereich) durch `url("pfad/zum/foto.jpg")` ersetzen.
