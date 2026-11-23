# ADR-0013: Hosting auf Vercel mit Produktivdeployment über GitHub Actions

- **Status:** Vorgeschlagen
- **Datum:** 2026-11-22
- **Beteiligt:** beide Entwickler
- **Bezug:** F2, F3, F11; ADR-0003, ADR-0010, ADR-0012 (zurückgezogen), ADR-0014

## Kontext

ADR-0012 sah Cloudflare vor. Der Plan hat sich geändert: Die Website wird über
Vercel veröffentlicht, die Domain bleibt `altstipendiaten-jahrestagung.de`
(registriert bei Strato). Das Repository ist bereits mit Vercel verbunden; Vercel
baut zu jedem Pull Request eine Vorschau.

Der Build bleibt rein statisch (ADR-0003). Dynamisch sind nur die Ankündigungen,
die der Browser direkt aus Supabase lädt (ADR-0014). Vercel muss also keinen
Servercode ausführen.

`AGENTS.md` verlangt Produktivdeployments nur vom freigegebenen Hauptbranch, mit
GitHub Environments und erforderlichen Freigaben.

## Entscheidung

1. **Hosting:** Vercel, statische Ausgabe von Astro (`dist/`) ohne Adapter.
   Konfiguration in `vercel.json`.
2. **Vorschauen:** Die Git-Anbindung von Vercel baut weiterhin jeden Branch außer
   `main` als Vorschau.
3. **Produktion:** Nur der Workflow `deployment.yml` deployt `main`, nach Freigabe im
   GitHub Environment `production`. Die Git-Anbindung deployt `main` nicht
   (`git.deploymentEnabled.main: false`). Der Workflow prüft danach die echte Adresse.
4. **DNS:** Bleibt bei Strato. Die Domain zeigt per `A`-Eintrag, `www` per
   `CNAME` auf Vercel; `www` leitet dauerhaft auf die Adresse ohne `www` weiter.
5. **Umgebungsvariablen** der App (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`,
   `ZUGANGSWORT`) liegen in den Vercel-Projekteinstellungen. GitHub kennt nur das
   Vercel-Token und die Projektkennungen.
6. **Vorabzugang:** Bis zum Go-Live bleibt die Zugangsabfrage aus ADR-0010 aktiv
   (`ZUGANGSWORT` in Vercel). Der Workflow schlägt fehl, wenn sie fehlt, solange die
   Variable `VORABZUGANG` nicht `aus` ist.

## Konsequenzen

**Positiv:** Keine Nameserver-Umstellung; bestehende DNS-Einträge (etwa für E-Mail)
bleiben unberührt. Vorschauen je PR gibt es ohne eigenen Code. Rollback auf eine
frühere Version geht im Vercel-Dashboard mit einem Klick.

**Negativ:**

- **Kein Zugriffsschutz vor dem Go-Live.** Vercel schützt im kostenfreien Tarif die
  Produktionsdomain nicht; die Zugangsabfrage aus ADR-0010 ist nur eine
  Sichtbarkeitsbarriere. Inhalte, die nicht nach außen dürfen (F14, F16), gehören
  weiterhin nicht in die App.
- **Tarif:** Der Hobby-Tarif von Vercel ist laut Nutzungsbedingungen auf private,
  nicht kommerzielle Nutzung beschränkt. Ob eine Vereinsseite darunter fällt oder
  ein Pro-Tarif nötig ist, muss vor dem Go-Live geklärt werden (F2).
- Vercel verarbeitet IP-Adressen aller Besucher (Vercel Inc., USA). Das gehört in
  die Datenschutzerklärung; die Auftragsverarbeitung klärt der Vorstand.
- Zwei Wege führen zu Vercel (Git-Anbindung für Vorschauen, Workflow für
  Produktion). Wer `vercel.json` ändert, muss beide im Blick haben.

## Verworfene Alternativen

- **Cloudflare (ADR-0012).** Hätte mit Access echten Vorabschutz geboten; der Verein
  hat sich für Vercel entschieden.
- **Produktion über die Git-Anbindung von Vercel.** Einfacher, aber ohne Freigabe im
  GitHub Environment und ohne Prüfung der echten Adresse nach dem Deployment.
- **Nameserver zu Vercel umziehen.** Nicht nötig für zwei Einträge und hätte alle
  übrigen DNS-Einträge mitgenommen.
- **Domain erst zum Go-Live verbinden** und bis dahin nur die `*.vercel.app`-Adresse
  nutzen. Schützt nicht besser (die Adresse ist ebenso öffentlich) und verschiebt
  DNS-Probleme auf den Tag des Go-Live.

## Offene Punkte

- Tarif Hobby oder Pro (siehe oben), und wem das Vercel-Konto gehört (F2).
- Ob Vorschauen hinter „Vercel Authentication" liegen: Dann sieht sie nur, wer Mitglied
  des Vercel-Teams ist. In den Projekteinstellungen unter Deployment Protection prüfen.
- Eine Content-Security-Policy fehlt noch (eigene Story); sie muss Supabase als
  Verbindungsziel erlauben.
