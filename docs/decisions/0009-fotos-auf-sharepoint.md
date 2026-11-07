# ADR-0009: Tagungsfotos auf dem SharePoint des Vereins

- **Status:** Angenommen
- **Datum:** 2026-09-27
- **Bezug:** offene Frage F5; Journey J6; Issue zur Fotoseite

## Kontext

Teilnehmende sollen Fotos der Tagung teilen und ansehen können (Journey J6). Auf
solchen Bildern sind Menschen zu erkennen — das sind personenbezogene Daten, und wie
Einwilligung, Widerruf und Löschung geregelt werden, ist offen (F5).

Zur Wahl standen drei Wege:

|                           | SharePoint des Vereins  | Nextcloud mit Upload-Link | Eigene Upload-Funktion |
| ------------------------- | ----------------------- | ------------------------- | ---------------------- |
| Neuer Auftragsverarbeiter | nein, bereits vorhanden | je nach Betrieb           | nein                   |
| Hochladen ohne Konto      | nein                    | ja                        | ja                     |
| Aufwand für uns           | gering                  | mittel                    | hoch                   |
| Speichert die App Bilder  | nein                    | nein                      | **ja**                 |

## Entscheidung

Die Fotos liegen auf dem SharePoint des Vereins. **Die App verlinkt nur** — sie nimmt
selbst keine Bilder entgegen und speichert keine.

## Konsequenzen

**Positiv:** Kein weiterer Auftragsverarbeiter, die Rechteverwaltung des Vereins greift
unverändert, und der Zugriff lässt sich pro Person entziehen. Vor allem aber bleibt die
offene Rechtsfrage F5 **außerhalb der Anwendung**: Wir speichern keine Fotos, müssen
keine löschen und keine Löschanfrage beantworten. Für ein ehrenamtliches Team ist das
der entscheidende Punkt.

**Negativ:** Hochladen setzt einen Vereinszugang voraus. Gäste ohne Zugang können sich
nicht beteiligen — und der typische Fall ist das Foto vom Festabend um 23 Uhr, vom
Handy, ohne Lust auf eine Anmeldung. Das wird die Beteiligung senken. Ob das hinnehmbar
ist, hängt daran, wie viele Teilnehmende überhaupt einen Zugang haben; das ist nicht
erhoben.

Außerdem liegen die Bilder dann nicht dort, wo die Tagung stattfindet — Nutzende
verlassen die App. Das ist ein Bruch, aber ein ehrlicher: Die App kann nicht
versprechen, was sie nicht hält.

## Verworfene Alternativen

- **Nextcloud mit öffentlichem Upload-Link.** Fachlich der bessere Ablauf — Hochladen
  ohne Konto, Daten in der EU. Setzt aber eine Instanz voraus; ist keine vorhanden,
  kommt Betrieb hinzu, den zwei Ehrenamtliche dauerhaft tragen müssten.
- **Eigene Upload-Funktion in der App.** Bester Komfort, mit Abstand teuerste Variante:
  Sie bräuchte den Dienst aus ADR-0004, Speicher, Moderation und eine Antwort auf F5.
  Und sie würde uns zum Verantwortlichen für die Bilder machen — genau das, was der
  gewählte Weg vermeidet.
- **Geteiltes Album bei einem großen Anbieter.** Am bequemsten für Nutzende, aber
  Datenabfluss an einen Dritten und für einen Verein datenschutzrechtlich heikel.

## Offene Punkte

- **F5** bleibt offen und ist vor der Tagung zu beantworten — auch beim Verlinken
  braucht es einen Hinweis, auf welcher Grundlage die Bilder geteilt werden und an wen
  man sich wendet, wenn man ein Bild entfernt haben möchte.
- Die Adresse des Ordners fehlt noch. Bis dahin steht auf der Fotoseite **kein Knopf**,
  der ins Leere führt.
- Sollte sich zeigen, dass zu wenige Teilnehmende einen Vereinszugang haben, ist diese
  Entscheidung neu zu treffen.
