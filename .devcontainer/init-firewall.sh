#!/bin/bash
# Forked from https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh
# Uebernommen aus dem reporting-copilot-Devcontainer, Allowlist auf dieses Repo gekuerzt:
# keine GitLab-, PyPI-, Prisma- und Fachaufsichts-Hosts, dafuer cdnjs (jsPDF, s. u.).
set -euo pipefail
IFS=$'\n\t'

DOCKER_DNS_RULES=$(iptables-save -t nat | grep "127\.0\.0\.11" || true)

# Policy-Reset MUSS vor dem Flush stehen. `iptables -F` loescht REGELN, nicht POLICIES —
# der vorige Lauf endete mit `-P OUTPUT DROP` (unten). Ohne diesen Reset ist nach dem
# Flush kein ACCEPT-Regelwerk mehr da, die DROP-Policy gilt aber weiter: jedes ausgehende
# Paket faellt in sie, der GitHub-Meta-Fetch scheitert, und `set -euo pipefail` beendet das
# Skript vor `ipset create` — Container halb offen. Beim ERSTEN Start faellt das nie auf
# (Docker-Default ist ACCEPT); sichtbar wird es nur beim Re-Run, also auf dem Pfad, den
# `postStartCommand` bei jedem Container-Start nimmt.
iptables -P INPUT   ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT  ACCEPT

iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true

if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "Restoring Docker DNS rules..."
    iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
    iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
    echo "$DOCKER_DNS_RULES" | xargs -L 1 iptables -t nat
else
    echo "No Docker DNS rules to restore"
fi

iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT  -p udp --sport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT  -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Eingehend auf den Vorschau-Port. Fuer die Portweiterleitung von VS Code ist die Regel
# NICHT noetig — die laeuft ueber einen Prozess IM Container gegen 127.0.0.1 und faellt
# damit unter die lo-Regel darueber. Gebraucht wird sie, sobald der Container mit
# `docker run -p` gestartet wird: das Paket kommt dann ueber eth0 herein, faellt in die
# DROP-Policy und der Aufruf laeuft in einen Timeout, waehrend `curl` im Container
# sauber 200 liefert — eine Fehlersuche, die leicht eine Stunde kostet.
#
# Literale 8080 statt ${PREVIEW_PORT}: das Skript laeuft per `sudo`, und sudo raeumt die
# Umgebung aus (env_reset) — die Variable aus containerEnv kaeme hier nie an. Wird der
# Port geaendert, muss er an drei Stellen mitgeaendert werden: hier, PREVIEW_PORT und
# forwardPorts in devcontainer.json.
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

ipset create allowed-domains hash:net

echo "Fetching GitHub IP ranges..."
# `-sS` statt `-s` — `-s` allein verschluckt auch die Fehlermeldung, und genau die braucht
# man, wenn ein Container-Start hier stehenbleibt. `--max-time` ist die Obergrenze fuer den
# GANZEN Aufruf: ohne sie haengt ein Start an einem stillen Netz unbegrenzt.
gh_ranges=$(curl -sS --connect-timeout 10 --max-time 30 --retry 2 https://api.github.com/meta)
if [ -z "$gh_ranges" ]; then
    echo "ERROR: Failed to fetch GitHub IP ranges"
    exit 1
fi
if ! echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null; then
    echo "ERROR: GitHub API response missing required fields"
    exit 1
fi

echo "Processing GitHub IPs..."
while read -r cidr; do
    if [[ ! "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        echo "ERROR: Invalid CIDR range from GitHub meta: $cidr"
        exit 1
    fi
    echo "Adding GitHub range $cidr"
    ipset add allowed-domains "$cidr"
done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q)

# VSIX-Downloads kommen NICHT von marketplace.visualstudio.com, sondern von
# publisher-eigenen CDN-Hosts. Das Muster ist `<publisher>.gallery.vsassets.io` UND
# `<publisher>.gallerycdn.vsassets.io` — BEIDE; wer nur einen eintraegt, sucht den Fehler
# an der falschen Stelle. `anthropic.*` deckt anthropic.claude-code aus devcontainer.json
# ab; eine Extension aus einem ANDEREN publisher braucht ihr eigenes Host-PAAR hier.
#
# release-assets.githubusercontent.com faellt NICHT unter die .web/.api/.git-Ranges aus
# api.github.com/meta, steht deshalb namentlich hier — sonst laeuft jeder Download eines
# GitHub-Release-Assets in ETIMEDOUT.
#
# cdnjs.cloudflare.com liefert jsPDF + jspdf-autotable, die index.html per <script> laedt.
# Fuer die Vorschau im Browser ist der Eintrag nicht noetig (die Seite laedt im Browser
# auf dem Windows-Host, nicht im Container) — noetig wird er, sobald hier drin ein
# Abruf stattfindet, etwa um die Bibliotheken lokal zu vendorn oder eine Version zu pruefen.
#
# Kein Kommentar INNERHALB der Liste: die Zeilen haengen an `\` an einer logischen Zeile,
# ein `#` dazwischen wuerde den Rest verschlucken.
for domain in \
    "api.anthropic.com" \
    "claude.ai" \
    "platform.claude.com" \
    "downloads.claude.ai" \
    "bridge.claudeusercontent.com" \
    "raw.githubusercontent.com" \
    "objects.githubusercontent.com" \
    "release-assets.githubusercontent.com" \
    "registry.npmjs.org" \
    "cdnjs.cloudflare.com" \
    "sentry.io" \
    "statsig.anthropic.com" \
    "statsig.com" \
    "marketplace.visualstudio.com" \
    "vscode.blob.core.windows.net" \
    "update.code.visualstudio.com" \
    "vscode.download.prss.microsoft.com" \
    "anthropic.gallery.vsassets.io" \
    "anthropic.gallerycdn.vsassets.io"; do
    echo "Resolving $domain..."
    ips=$(dig +short A "$domain" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || true)
    if [ -z "$ips" ]; then
        echo "WARN: Failed to resolve $domain — skipping"
        continue
    fi
    while read -r ip; do
        echo "Adding $ip for $domain"
        ipset add allowed-domains "$ip" 2>/dev/null || true
    done < <(echo "$ips")
done

HOST_IP=$(ip route | grep default | cut -d" " -f3)
if [ -z "$HOST_IP" ]; then
    echo "ERROR: Failed to detect host IP"
    exit 1
fi

HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
echo "Host network detected as: $HOST_NETWORK"
iptables -A INPUT  -s "$HOST_NETWORK" -j ACCEPT
iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT

iptables -P INPUT   DROP
iptables -P FORWARD DROP
iptables -P OUTPUT  DROP

iptables -A INPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

echo "Firewall configuration complete"
echo "Verifying firewall rules..."
if curl --connect-timeout 5 https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - was able to reach https://example.com"
    exit 1
else
    echo "Firewall verification passed - unable to reach https://example.com as expected"
fi

if ! curl --connect-timeout 5 https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - unable to reach https://api.github.com"
    exit 1
else
    echo "Firewall verification passed - able to reach https://api.github.com as expected"
fi
