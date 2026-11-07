# ADR-0010: Zugangsabfrage vor der unfertigen Anwendung

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-27
- **Bezug:** offene Fragen F3, F11; ADR-0005

## Kontext

Die Anwendung soll früh auf einer erreichbaren Adresse laufen, damit beide Entwickler
und das Orga-Team sie auf echten Geräten ansehen können. Gleichzeitig ist sie
unfertig: Inhalte sind teils vorläufig, Personennamen im Programm sind noch nicht
freigegeben (F14), Bildrechte an den Porträts sind ungeklärt (F16). Ein zufälliger
Fund über eine Suchmaschine oder ein weitergereichter Link wäre deshalb schädlich,
bevor die Freigaben vorliegen.

Gesucht ist also **keine** Zugriffskontrolle, sondern eine Hürde gegen zufälliges
Auffinden und beiläufiges Weiterreichen. Ob die fertige App öffentlich oder
geschlossen sein soll, ist eine andere Frage und weiterhin offen (F3).

Erschwerend: Das Repository ist öffentlich. Ein Zugangswort im Quelltext wäre mit dem
Commit veröffentlicht — und über die Git-Historie nicht zurückzuholen. `AGENTS.md`
verbietet Secrets im Commit ausdrücklich.

## Entscheidung

Vor der Anwendung steht eine Abfrage mit **einem gemeinsamen Zugangswort**.

1. Das Wort kommt aus der Umgebungsvariablen `ZUGANGSWORT` des Bauvorgangs. Ist sie
   nicht gesetzt, gibt es die Sperre nicht — Entwicklung, Tests und CI laufen
   unverändert.
2. In das gebaute Ergebnis gelangt nur ein **gesalzener SHA-256-Wert**, nie das Wort.
3. Gesperrt ist der Auslieferungszustand: Das Attribut steht im HTML, nicht erst nach
   einem Skript. Ohne JavaScript bleibt es bei der Abfrage.
4. Nach erfolgreicher Eingabe merkt sich das Gerät die Freigabe lokal. Ändert sich das
   Zugangswort, passt der gespeicherte Wert nicht mehr und die Abfrage erscheint wieder.
5. Solange die Sperre aktiv ist, trägt jede Seite `robots: noindex, nofollow`.

## Konsequenzen

**Positiv:** Die App lässt sich auf echten Geräten und auf einer echten Adresse
erproben, ohne dass unfertige Inhalte und ungeklärte Namensnennungen öffentlich
auffindbar werden. Kein Konto, kein Benutzerverzeichnis, keine personenbezogenen
Daten — die Sperre bleibt mit ADR-0005 vereinbar. Das Zugangswort ist nicht im
Repository und lässt sich durch einen neuen Build wechseln.

**Negativ — und das ist ausdrücklich festzuhalten:** Dies ist eine
**Sichtbarkeitsbarriere, kein Zugriffsschutz.** Die Seiten sind statisch; ihr
vollständiges HTML steht im Antwortkörper, bevor ein Skript läuft. Wer `curl` bedienen
kann oder den Quelltext ansieht, liest die Inhalte ohne das Wort. Der Hashwert ist
zudem angreifbar: Ein kurzes Wort lässt sich mit genügend Rechenzeit durchprobieren.

Daraus folgt: **Inhalte, die wirklich nicht nach außen dürfen, gehören auch mit dieser
Sperre nicht in die Anwendung.** F14 und F16 werden dadurch nicht beantwortet.

Ein gemeinsames Wort ist außerdem nicht einzeln widerrufbar und wandert erfahrungsgemäß
weiter — dasselbe Argument, mit dem ADR-0005 ein gemeinsames Zugangswort für den
Produktivbetrieb verworfen hat. Für eine Bauphase ist das vertretbar, als Dauerlösung
nicht.

## Verworfene Alternativen

- **HTTP-Basisauthentifizierung beim Hoster.** Fachlich die richtige Antwort: Sie wirkt
  vor der Auslieferung, das HTML verlässt den Server gar nicht erst. Setzt aber einen
  entschiedenen Hoster voraus (F2, F11) — und die Entscheidung steht aus. **Sobald sie
  fällt, ersetzt sie diese Lösung.**
- **Gar keine Sperre, nur `noindex`.** Hält Suchmaschinen fern, aber nicht den
  weitergereichten Link.
- **Zugangswort im Quelltext.** Im öffentlichen Repository dasselbe wie keine Sperre,
  nur mit dem falschen Gefühl von Schutz.
- **Einmallinks je Person wie in ADR-0005.** Wäre widerrufbar und sauberer, braucht aber
  den Serverdienst aus ADR-0004, den es noch nicht gibt.

## Offene Punkte

- **F2/F11** — mit dem Hoster steht die Basisauthentifizierung zur Verfügung; dieses ADR
  ist dann abzulösen.
- **F3** — ob die fertige App öffentlich ist, bleibt unabhängig davon zu entscheiden.
- Wer verwaltet das Zugangswort, und auf welchem Weg erreicht es das Orga-Team? Nicht
  über dasselbe Medium wie den Link.
