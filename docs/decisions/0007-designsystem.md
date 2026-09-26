# ADR-0007: Designsystem auf rollenbasierten Tokens

- **Status:** Vorgeschlagen
- **Datum:** 2026-09-26
- **Bezug:** offene Frage F7; `docs/ui-ux-designregeln.md`; `AGENTS.md` Abschnitte „UI/UX und UI-Tests" und „Corporate Design und Markenführung"

## Kontext

`AGENTS.md` verlangt ein konsistentes Designsystem mit klarer Typografie, Abständen,
Farben, Formularzuständen und Komponenten — und ausreichende Kontraste unabhängig von
der Markenfarbe.

Der bestehende Entwurf hat dafür bereits ein tragfähiges Fundament: Farbtokens sind
**nach Rolle** benannt (`--accent-ink` für Blau als Text, `--heading-ink` für Blau in
Überschriften, `--field`, `--hover`), nicht nach Farbwert. Die dunkle Palette wird an
einer Stelle gepflegt und getrennt zugewiesen, sodass Systemautomatik und Handschalter
nicht auseinanderlaufen können. Eine Kontrastkorrektur ist im Code begründet
dokumentiert: `--tint-orange-ink` wurde von `#D97F00` auf `#9C5A00` geändert, weil der
ursprüngliche Wert nur 2,7:1 ergab.

Das ist genau der Ansatz, der eine spätere Markenfreigabe überlebt — denn dann ändern
sich Werte, nicht Bedeutungen.

**Wichtig:** Die Farbwerte sind laut Kommentar im Code **aus dem Vereinslogo
abgeleitet**, ergänzt um selbst gewählte Zusatzfarben. Sie stammen nicht aus
freigegebenen Markenunterlagen. `AGENTS.md` verbietet, offizielle Hex-Werte zu erfinden.

## Entscheidung

Wir übernehmen den rollenbasierten Tokenansatz und formalisieren ihn: Tokens werden in
eine eigene, dokumentierte Quelle überführt (Farbe, Typografie, Abstände, Radien,
Schatten, Bewegungsdauern), aus der Hell- und Dunkeldarstellung abgeleitet werden.
Komponenten verwenden **ausschließlich** Tokens, nie direkte Farbwerte.

Bis zur Freigabe durch den Verein (F7) gelten die aktuellen Werte ausdrücklich als
**vorläufig** und sind im Repository als solche gekennzeichnet. Kontrastanforderungen
(WCAG 2.2 AA) haben Vorrang vor Markentreue; wo beides kollidiert, wird die Kollision
dokumentiert und dem Verein vorgelegt.

## Konsequenzen

**Positiv:** Eine Markenfreigabe wird zum Austausch von Werten, nicht zum Umbau von
Komponenten. Der Dunkelmodus bleibt gleichwertig und an einer Stelle pflegbar.
Kontrastfehler lassen sich automatisiert gegen die Tokens prüfen. Die bereits im Code
dokumentierten Begründungen bleiben erhalten, statt beim Umbau verloren zu gehen.

**Negativ:** Rollenbasierte Benennung ist beim Schreiben unbequemer als „nimm Blau" und
braucht Disziplin — ein direkt gesetzter Farbwert fällt im Review leicht durch. Die
Zahl der Tokens wächst; ohne Pflege entstehen Doppelungen. Die Vorläufigkeit der
Farbwerte muss bis zur Freigabe sichtbar bleiben, sonst wird sie stillschweigend zur
Tatsache.

## Verworfene Alternativen

- **Fertiges UI-Framework (Bootstrap, Material, Tailwind-Vorlage).** Schneller Start,
  aber eine fremde Gestaltungssprache, die der geforderten eigenständigen, zum ASeV
  passenden Anmutung entgegensteht — und ein Mehrfaches an nicht genutztem CSS.
- **Farbtokens nach Farbwert benennen** (`--blau-700`). Genau der Ansatz, den der
  bestehende Code bewusst verworfen hat; er macht Dunkelmodus und Markenwechsel zur
  Suchen-und-Ersetzen-Übung.
- **Auf den Dunkelmodus verzichten.** Er ist bereits gebaut und durchdacht; ihn
  aufzugeben wäre ein Rückschritt für Lesbarkeit bei Dunkelheit — relevant an
  Tagungsabenden.

## Offene Punkte

- **F7** — offizielle Markenunterlagen des ASeV bzw. der KAS.
- Wahl der Schrift: Der Entwurf nutzt den System-Font-Stack. Eine selbst gehostete
  Schrift (kein externes CDN, siehe Datenschutz) ist der größte Einzelhebel für ein
  eigenständiges Erscheinungsbild — Auswahl und Lizenz sind noch zu klären.
