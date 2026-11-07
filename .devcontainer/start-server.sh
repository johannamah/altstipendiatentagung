#!/bin/bash
# Statischer Webserver fuer die Vorschau von index.html.
#
# Warum ueberhaupt ein Server: index.html laesst sich zwar per Doppelklick oeffnen
# (file://), aber site.webmanifest und die Icon-Pfade werden dabei nicht sauber
# aufgeloest — der Fall "am Handy zum Homescreen hinzufuegen" ist so nicht testbar.
# Ueber http://localhost:8080 verhaelt sich die Seite wie spaeter auf GitHub Pages.
#
# Laeuft als `node`, ohne sudo: Port 8080 ist unprivilegiert.
#
# Idempotent: postStartCommand laeuft bei JEDEM Containerstart, ein zweiter `serve`
# auf demselben Port wuerde sonst mit EADDRINUSE abbrechen.
set -euo pipefail

# Nicht auf ein geerbtes PATH verlassen: das Skript laeuft je nach Aufrufer mal mit
# dem PATH aus dem Image (postStartCommand), mal in einer Login-Shell, in der
# Debians /etc/profile den PATH neu setzt. Ohne diese Zeile scheitert der Start dort
# an "nohup: failed to run command 'serve'".
export PATH="$PATH:/usr/local/share/npm-global/bin"

PORT="${PREVIEW_PORT:-8080}"
LOG=/tmp/serve.log

port_offen() {
  (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null
}

if port_offen "$PORT"; then
  echo "start-server: Port $PORT ist bereits belegt — nichts zu tun."
  exit 0
fi

# --no-clipboard: `serve` versucht sonst, die URL in die Zwischenablage zu kopieren,
# und schreibt im Container ohne X-Server eine irrefuehrende Fehlermeldung ins Log.
# --no-port-switching: ohne das weicht serve bei belegtem Port still auf einen
# anderen aus — die weitergeleitete 8080 zeigte dann ins Leere.
nohup serve /workspace --listen tcp://0.0.0.0:"$PORT" --no-clipboard --no-port-switching \
  >"$LOG" 2>&1 &

# Ohne diese Warteschleife meldet das Skript Erfolg, sobald `nohup` abgesetzt ist —
# auch dann, wenn `serve` eine Sekunde spaeter wegstirbt. Genau so kam der erste
# Testlauf durch, waehrend die Vorschau in Wahrheit nie lief.
for _ in $(seq 1 20); do
  if port_offen "$PORT"; then
    echo "start-server: Vorschau laeuft auf http://localhost:$PORT (Log: $LOG)"
    exit 0
  fi
  sleep 0.5
done

# Kein Exit-Code != 0: ein fehlgeschlagener postStartCommand laesst die
# Dev-Containers-Extension den GESAMTEN Containerstart als fehlgeschlagen melden.
# Eine kaputte Vorschau ist das nicht wert — der Container bleibt nutzbar, die
# Meldung sagt, wo man nachsieht.
echo "start-server: FEHLER — serve ist auf Port $PORT nicht hochgekommen. Log:" >&2
cat "$LOG" >&2 || true
exit 0
