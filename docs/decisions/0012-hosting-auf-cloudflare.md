# ADR-0012: Hosting auf Cloudflare mit Deployment über GitHub Actions

- **Status:** Vorgeschlagen
- **Datum:** 2026-11-07
- **Beteiligt:** beide Entwickler
- **Bezug:** F2, F3, F11; ADR-0003, ADR-0004, ADR-0005, ADR-0010

## Kontext

Die Domain `altstipendiaten-jahrestagung.de` ist gekauft (Registrar: Strato). Die
App soll automatisch per GitHub Actions nach Cloudflare deployt werden. Der Build ist
rein statisch (`dist/`, ADR-0003); Server-Endpunkte gibt es nicht, ADR-0004 könnte sie
später verlangen.

Bis zur Freigabe (geplant etwa Anfang Dezember 2026) soll die App nur für
freigegebene Personen erreichbar sein. Die clientseitige Sperre aus ADR-0010 ist dafür
ausdrücklich nur eine Übergangslösung: Das HTML steht ungeschützt im Antwortkörper.
Für die Vorabphase dürfen die E-Mail-Adressen der freigegebenen Personen bei
Cloudflare hinterlegt werden.

## Entscheidung

1. **Hosting:** Cloudflare Workers mit statischen Assets. Ausgeliefert wird `dist/`,
   die Konfiguration steht als `wrangler.jsonc` im Repository.
2. **DNS:** Die Zone liegt bei Cloudflare; bei Strato werden nur die Nameserver
   umgestellt. Maßgeblich ist `https://altstipendiaten-jahrestagung.de`, `www.` leitet
   per 301 dorthin weiter. Die automatische `*.workers.dev`-Adresse ist abgeschaltet.
3. **Deployment:** Der Workflow `deployment.yml` deployt nach jedem Merge auf `main`,
   sobald die Freigabe im GitHub Environment `production` erteilt ist. Vorher läuft
   die schnelle Prüfstufe noch einmal auf genau diesem Commit; die gründliche Stufe
   ist bereits als erforderlicher Check des PR gelaufen. Danach ruft der Workflow die
   echte Adresse ab: Solange die Repository-Variable `VORABZUGANG` nicht `aus` ist,
   muss Cloudflare Access davorstehen, sonst schlägt das Deployment fehl. In
   Pull Requests läuft nur ein Trockenlauf ohne Zugangsdaten. Das API-Token liegt
   ausschließlich als Environment-Secret vor und darf nur Workers dieses Kontos und
   dieser Zone bearbeiten.
4. **Vorabzugang:** Cloudflare Access mit Einmalcode per E-Mail schützt Domain und
   Vorschau-Adressen. Die Liste der freigegebenen Adressen wird nur bei Cloudflare
   gepflegt, nie im Repository. Mit dem Go-Live wird die Access-Regel entfernt.
5. **Konto:** Vorerst ein gemeinsames Cloudflare-Konto beider Entwickler, mit
   Zwei-Faktor-Anmeldung und Zugangsdaten in einem gemeinsamen Passwortmanager.
6. **Kopfzeilen** (Caching, Sicherheit) stehen versioniert in `public/_headers`; nur
   Access und die `www`-Weiterleitung werden im Dashboard eingerichtet.

## Konsequenzen

**Positiv:** Der Schutz wirkt vor der Auslieferung; ohne Freigabe verlässt kein HTML
den Server. Damit ist die Lösung, die ADR-0010 als Ablösung vorsieht, verfügbar. Keine
eigene Server-Infrastruktur. Ein späterer Endpunkt nach ADR-0004 passt in denselben
Worker. Rollback ist mit `wrangler rollback` möglich.

**Negativ:** Cloudflare verarbeitet IP-Adressen aller Besucher, in der Vorabphase
zusätzlich E-Mail-Adressen. Beides muss in der Datenschutzerklärung stehen, und der
Vorstand muss die Auftragsverarbeitung mit Cloudflare klären (F2). Ein gemeinsames
Konto ist nicht personengebunden: Wer etwas geändert hat, ist nicht nachvollziehbar,
und ein Ausscheiden erzwingt einen Passwortwechsel. Für die Zeit nach der Tagung ist
das keine Dauerlösung. Access ist nur bis 50 Nutzer kostenfrei.

## Verworfene Alternativen

- **Cloudflare Pages.** Einfachere Vorschau-Adressen je Branch, aber neue Funktionen
  entwickelt Cloudflare für Workers; ein späterer Server-Endpunkt wäre dort
  umständlicher.
- **Basisauthentifizierung im Worker.** Kommt ohne E-Mail-Adressen aus, ist aber ein
  gemeinsames Passwort, nicht einzeln widerrufbar und eigener Code. Mit der Freigabe
  der Adressen ist Access einfacher.
- **Weiterhin nur die clientseitige Sperre aus ADR-0010.** Kein Zugriffsschutz.
- **GitHub Pages.** Kein vorgelagerter Zugriffsschutz möglich.

## Offene Punkte

- Die bestehende Vercel-Anbindung erzeugt für jeden PR eine öffentlich erreichbare
  Vorschau, an Access vorbei. Sie ist zu trennen oder dort mit Zugriffsschutz zu
  versehen.
- Eine Content-Security-Policy fehlt noch: Astro bettet Skripte inline ein, eine
  sinnvolle Richtlinie braucht Hashwerte statt `unsafe-inline`. Eigene Story.
- `robots.txt` und Indexierung nach dem Go-Live hängen an F3 (öffentlich oder nur
  für Berechtigte).

- Wann geht das Konto in den Besitz des Vereins über, und wer ist nach der Tagung
  verantwortlich (F2)?
- Auftragsverarbeitung mit Cloudflare und Speicherdauer der Zugriffsprotokolle
  (Datenschutzerklärung).
- Ob die clientseitige Sperre aus ADR-0010 neben Access bestehen bleibt oder entfällt.
