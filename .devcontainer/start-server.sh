#!/bin/bash
# Startet den Astro-Entwicklungsserver (`npm run dev`) im Hintergrund.
#
# --host 0.0.0.0: Astro lauscht sonst nur auf 127.0.0.1 im Container. Die
# Portweiterleitung von VS Code kaeme damit zwar noch durch (sie laeuft ueber einen
# Prozess IM Container), ein Start mit `docker run -p` aber nicht.
#
# Laeuft als `node`, ohne sudo: Port 4321 ist unprivilegiert.
#
# Idempotent: postStartCommand laeuft bei JEDEM Containerstart, ein zweiter Server
# auf demselben Port wuerde sonst still auf 4322 ausweichen und die weitergeleitete
# 4321 zeigte auf den alten Prozess.
set -euo pipefail

# Nicht auf ein geerbtes PATH verlassen: das Skript laeuft je nach Aufrufer mal mit
# dem PATH aus dem Image (postStartCommand), mal in einer Login-Shell, in der
# Debians /etc/profile den PATH neu setzt.
export PATH="$PATH:/usr/local/share/npm-global/bin"

PORT="${PREVIEW_PORT:-4321}"
LOG=/tmp/astro-dev.log

port_offen() {
  (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null
}

if port_offen "$PORT"; then
  echo "start-server: Port $PORT ist bereits belegt — nichts zu tun."
  exit 0
fi

cd /workspace

# Ohne Abhaengigkeiten kein Server. postCreateCommand installiert sie nur beim
# ERSTEN Anlegen des Containers; ist das Volume leer (z. B. nach `docker volume rm`),
# hilft ein `npm ci` von Hand.
if [ ! -x node_modules/.bin/astro ]; then
  echo "start-server: node_modules/.bin/astro fehlt — erst 'npm ci' ausfuehren, dann $0." >&2
  exit 0
fi

# --port explizit, damit PREVIEW_PORT auch dann gilt, wenn jemand den Standard in
# astro.config.mjs aendert.
nohup npm run dev -- --host 0.0.0.0 --port "$PORT" >"$LOG" 2>&1 &

# Ohne diese Warteschleife meldet das Skript Erfolg, sobald `nohup` abgesetzt ist —
# auch dann, wenn der Server eine Sekunde spaeter wegstirbt. Astro braucht auf dem
# 9p/drvfs-Bind-Mount von C:\ beim ersten Start deutlich laenger als nativ, daher
# bis zu 60 s.
for _ in $(seq 1 120); do
  if port_offen "$PORT"; then
    echo "start-server: Astro laeuft auf http://localhost:$PORT (Log: $LOG)"
    exit 0
  fi
  sleep 0.5
done

# Kein Exit-Code != 0: ein fehlgeschlagener postStartCommand laesst die
# Dev-Containers-Extension den GESAMTEN Containerstart als fehlgeschlagen melden.
# Ein nicht gestarteter Entwicklungsserver ist das nicht wert — der Container bleibt
# nutzbar, die Meldung sagt, wo man nachsieht.
echo "start-server: FEHLER — Astro ist auf Port $PORT nicht hochgekommen. Log:" >&2
cat "$LOG" >&2 || true
exit 0
