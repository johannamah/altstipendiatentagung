# Devcontainer

Gekapselte Entwicklungsumgebung für dieses Repository: Node 24, `git`, GitHub CLI (`gh`),
Claude Code; die Vorschau ist der Astro-Entwicklungsserver. Getestet mit **Rancher Desktop**
(dockerd/moby als Container-Engine) unter Windows.

## Starten

1. Rancher Desktop starten, Container-Engine auf **dockerd (moby)** stellen.
2. Ordner in VS Code öffnen → `Dev Containers: Reopen in Container`.
3. Beim ersten Start dauert der Build ein paar Minuten (apt-Pakete, Claude Code, `npm ci`).

Danach läuft `npm run dev -- --host 0.0.0.0` (Astro) auf
**[localhost:4321](http://localhost:4321)** — VS Code leitet den Port automatisch weiter.
Log: `/tmp/astro-dev.log`. Neu starten: `pkill -f "astro dev"; /usr/local/bin/start-server.sh`.

Rancher Desktop braucht dafür genug Speicher: Kubernetes ausschalten (wird nicht
gebraucht) und der WSL-VM in `~/.wslconfig` mindestens 4 GB geben. Mit 2 GB plus
Kubernetes reißt unter Last die Verbindung zum Docker-Daemon ab
(`timed out dialing Hyper-V socket`), und VS Code meldet den `postStartCommand` als
fehlgeschlagen, obwohl beide Skripte durchgelaufen sind.

## Was beim Start passiert

| Schritt | Wirkung |
| --- | --- |
| `postCreateCommand` | Setzt `safe.directory` und `core.autocrlf=input` für `/workspace` (s. u.), führt `npm ci` aus, solange das `node_modules`-Volume noch leer ist. |
| `postStartCommand` → `init-firewall.sh` | Egress-Allowlist per iptables/ipset. Alles, was nicht in der Liste steht, wird geblockt. |
| `postStartCommand` → `start-server.sh` | Startet den Astro-Entwicklungsserver auf Port 4321 im Hintergrund (idempotent, wartet auf den Port und meldet einen Fehlstart). |
| `postAttachCommand` | Weist darauf hin, wenn `gh` noch nicht authentifiziert ist (`gh auth login --web`). |

Beide Skripte vertragen wiederholte Aufrufe — `postStartCommand` läuft bei jedem
Containerstart, nicht nur beim ersten.

## Firewall

`init-firewall.sh` ist die Fassung aus dem `reporting-copilot`-Devcontainer, die Allowlist
ist auf dieses Repo gekürzt: GitHub (Ranges aus `api.github.com/meta` plus die
`*.githubusercontent.com`-Hosts), Anthropic/Claude, npm-Registry, die VS-Code-CDNs für die
Claude-Code-Extension, `cdnjs.cloudflare.com` und die Playwright-Download-Hosts
`cdn.playwright.dev` und `playwright.download.prss.microsoft.com` (der erste leitet per 307
auf den zweiten weiter, deshalb beide) für `npx playwright install`.

Fehlt ein Host, äußert sich das als Timeout, nicht als klare Fehlermeldung. Neue Hosts
gehören in die `for domain in \`-Liste; danach reicht `sudo /usr/local/bin/init-firewall.sh`
im Container, ein Rebuild ist nicht nötig.

Die Regeln gelten nur für den Container. Der Browser auf dem Windows-Host ist davon nicht
betroffen — Supabase etwa wird von der Seite im Browser abgefragt und muss deshalb nicht in
die Liste.

Eingehend ist genau ein Port offen: 4321. Für die Portweiterleitung von VS Code wäre das
nicht nötig (die läuft über Loopback im Container), wohl aber für einen Start mit
`docker run -p`. Ohne die Regel läuft ein Zugriff vom Host in einen Timeout, während `curl`
im Container sauber 200 liefert.

**Der Port steht an drei Stellen** und muss beim Ändern überall mitgezogen werden:
`forwardPorts` und `PREVIEW_PORT` in `devcontainer.json` sowie die literale `4321` in
`init-firewall.sh` (dort keine Variable, weil `sudo` die Umgebung ausräumt).

## Persistenz über Rebuilds

Bash-Historie, Claude-Login und die `gh`-Anmeldung liegen in Named Volumes, die an
`${devcontainerId}` hängen und ein „Rebuild Container" überstehen. Nichts davon landet im
Repository.

`/workspace` selbst ist ein Bind-Mount auf den Windows-Ordner — Dateien werden also direkt
im Repo geändert, `git` funktioniert von beiden Seiten.

## Git im Container

Zwei Einstellungen setzt `postCreateCommand`, beide sind Folgen des Bind-Mounts von `C:\`:

- `safe.directory /workspace` — sonst verweigert git **jeden** Befehl mit
  „detected dubious ownership in repository at '/workspace'".
- `core.autocrlf input` — die Dateien liegen mit CRLF auf der Platte (so checkt Windows-Git
  sie aus), im Index stehen sie mit LF. Ohne die Einstellung meldet `git status` im
  Container praktisch jede Textdatei als
  geändert, obwohl niemand sie angefasst hat — und ein Commit aus dem Container würde CRLF
  ins Repo schreiben.

## Claude Code im Container

Claude Code ist im Image installiert (`claude`), die Anmeldung erfolgt einmalig im
Container und bleibt im Volume erhalten. Der Berechtigungsmodus ist bewusst **nicht**
vorkonfiguriert; wer im Container ohne Einzelfreigaben arbeiten will, kann das in
`devcontainer.json` unter `customizations.vscode.settings` ergänzen:

```jsonc
"claudeCode.allowDangerouslySkipPermissions": true,
"claudeCode.initialPermissionMode": "bypassPermissions"
```

Sinnvoll ist das nur, weil der Container samt Egress-Firewall die Kapselung übernimmt —
auf dem Host wäre es das nicht.

## Bekannte Stolpersteine

- **Namenskollision beim Rebuild:** Der Container heißt fest `altstipendiatentagung-dev`.
  Bleibt eine Leiche stehen: `docker rm -f altstipendiatentagung-dev`.
- **CRLF in den Skripten:** `.devcontainer/.gitattributes` erzwingt LF für `*.sh`. Ohne das
  scheitern sie im Container mit `bad interpreter: /bin/bash^M`.
- **`command not found` für `claude`:** Debians `/etc/profile` setzt `PATH` in
  Login-Shells neu und wirft `/usr/local/share/npm-global/bin` heraus. Deshalb legt das
  Dockerfile `/etc/profile.d/npm-global.sh` an, das den Pfad wieder anhängt.
- **Port 4321 belegt:** `start-server.sh` steigt kommentarlos aus, statt den Containerstart
  fehlschlagen zu lassen. Log der Vorschau: `/tmp/astro-dev.log`.
- **Playwright im Container:** Die Browser-Downloads sind freigegeben, die Systembibliotheken
  der Browser (`npx playwright install --with-deps`) aber nicht installierbar — `sudo` ist auf
  `init-firewall.sh` beschränkt. Die E2E-Tests laufen verlässlich in der CI.
