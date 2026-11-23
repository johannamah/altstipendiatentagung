FROM node:24

ARG TZ
ENV TZ="$TZ"

ARG CLAUDE_CODE_VERSION=latest

# ipset/iptables/aggregate/dnsutils werden ausschliesslich von init-firewall.sh
# gebraucht; ohne sie kommt der Container hoch, aber ohne Egress-Begrenzung.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    dnsutils \
    git \
    gnupg2 \
    iproute2 \
    ipset \
    iptables \
    jq \
    less \
    procps \
    sudo \
    aggregate \
  && install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
       | gpg --dearmor -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update && apt-get install -y --no-install-recommends gh \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node

RUN mkdir -p /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

ENV DEVCONTAINER=true

# Die Mount-Ziele MUESSEN hier vorangelegt und auf node umgeschrieben werden: Docker
# uebernimmt beim Anlegen eines leeren Named Volumes Eigentuemer und Rechte des
# gleichnamigen Verzeichnisses AUS DEM IMAGE. Fehlt das Verzeichnis, legt Docker das
# Volume als root an — und `node` kann nicht hineinschreiben. Nachtraeglich reparieren
# laesst sich das nicht: sudo ist bewusst auf init-firewall.sh beschraenkt
# (/etc/sudoers.d/node-firewall), ein `sudo chown` im postCreateCommand scheitert an
# der Passwortabfrage.
#
# /workspace/node_modules liegt sonst auf dem 9p/drvfs-Bind-Mount von C:\ — jeder
# Dateizugriff waere ein Protokoll-Roundtrip zum Windows-Host. Das Repo hat heute
# keine Abhaengigkeiten (package-lock.json ohne package.json), aber sobald doch ein
# Build-Tool dazukommt, ist das Volume schon da und der Pfad bleibt /workspace/node_modules.
#
# /home/node/.config selbst muss ebenfalls node gehoeren: `mkdir -p .config/gh` legt
# das Elternverzeichnis als root an, und Werkzeuge wie Astro (Telemetrie-Konfiguration
# unter ~/.config/astro) brechen dann mit EACCES ab.
RUN mkdir -p /workspace /workspace/node_modules \
      /home/node/.claude /home/node/.config/gh \
  && chown -R node:node /workspace /home/node/.claude /home/node/.config

WORKDIR /workspace

RUN mkdir -p /usr/local/share/npm-global \
  && chown -R node:node /usr/local/share/npm-global

USER node

ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# `serve` fest ins Image, nicht per `npx` zur Laufzeit: npx laedt bei jedem Start neu
# aus der Registry — das haengt an der Firewall und am Netz, obwohl an der Sache
# nichts Variables ist. index.html per file:// zu oeffnen reicht nicht, das Manifest
# und die Icon-Pfade brauchen einen echten HTTP-Origin.
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} serve@14

COPY init-firewall.sh start-server.sh /usr/local/bin/
USER root
# Das ENV PATH oben gilt NICHT in Login-Shells: Debians /etc/profile setzt PATH
# unbedingt neu und wirft /usr/local/share/npm-global/bin wieder heraus. Das
# integrierte Terminal von VS Code startet genau so eine Login-Shell — `claude` und
# `serve` waeren dort "command not found", obwohl beide im Image liegen. profile.d
# wird NACH dieser Neusetzung eingelesen und haengt den Pfad wieder an.
RUN chmod +x /usr/local/bin/init-firewall.sh /usr/local/bin/start-server.sh \
  && echo 'export PATH="$PATH:/usr/local/share/npm-global/bin"' > /etc/profile.d/npm-global.sh \
  && chmod 0644 /etc/profile.d/npm-global.sh \
  && echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall \
  && chmod 0440 /etc/sudoers.d/node-firewall
USER node
