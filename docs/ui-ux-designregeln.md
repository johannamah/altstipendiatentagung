# UI/UX-Designregeln

**Status:** Entwurf zur gemeinsamen Abstimmung · **Stand:** 2026-09-26
**Bezug:** [vision.md](vision.md), [ADR-0007](decisions/0007-designsystem.md), `AGENTS.md`

Diese Regeln sind **prüfbar formuliert**: Jede lässt sich in einem Review mit Ja oder
Nein beantworten. Wo eine Regel nicht eingehalten wird, gehört die Begründung in den
Pull Request — nicht in eine stille Ausnahme.

Grundlage sind die sechs Produktprinzipien aus der Vision. Bei Zielkonflikten gewinnt
das Prinzip mit der niedrigeren Nummer.

---

## 1. Informationsarchitektur und Navigation

1. **Jede Ansicht hat eine eigene, teilbare Adresse.** Der Zurück-Knopf des Browsers
   funktioniert immer, in beide Richtungen. _(Im Entwurf über Hash-Routing bereits
   erfüllt; beim Umbau auf echte Pfade nicht verlieren.)_
2. **Höchstens zwei Ebenen bis zu jeder Information.** Startseite → Bereich → Detail.
   Was tiefer liegt, ist falsch einsortiert.
3. **Auf dem Smartphone ist eine dauerhafte Navigation sichtbar.** Der Wechsel zwischen
   Programm, Anmeldung und Fotos darf nicht über die Startseite führen.
4. **Der wichtigste Inhalt der Phase steht oben.** Während der Tagungstage ist das der
   laufende und der nächste Programmpunkt — nicht die Begrüßung.
5. **Kein Karussell, kein Akkordeon für Kerninhalte.** Was wichtig ist, ist sichtbar.

## 2. Layout und Raster

6. Alle Abstände sind Vielfache von **4 px**, im Regelfall von 8 px. Keine krummen
   Einzelwerte.
7. **Touch-Ziele mindestens 44 × 44 px**, mit mindestens 8 px Abstand zueinander.
8. **Lesbare Zeilenlänge: 60–75 Zeichen** für Fließtext. Volle Bildschirmbreite auf dem
   Desktop ist ein Fehler, kein Feature.
9. Komponenten passen sich an ihren **Container** an, nicht an den Viewport
   (Container Queries) — dieselbe Karte muss in Haupt- und Nebenbereich funktionieren.
10. **Keine horizontale Scrollleiste**, in keiner Breite ab 320 px.

## 3. Typografie

11. Die Grundschriftgröße beträgt **mindestens 17 px auf dem Smartphone**. Begründung:
    Annahme A2, breites Altersspektrum.
12. Die Schriftskala ist **fließend** (`clamp()`), nicht an Haltepunkten gestuft.
13. Es gibt **eine** Schriftfamilie. Eine zweite braucht eine Begründung im Pull Request.
14. Schriften werden **selbst ausgeliefert**, nie über ein fremdes CDN. Begründung:
    Datenschutz — ein Google-Fonts-Aufruf überträgt die IP-Adresse der Nutzenden an
    Dritte.
15. Überschriften werden im Umbruch ausgeglichen (`text-wrap: balance`); einzelne
    Wörter in der letzten Zeile sind zu vermeiden.
16. **Text ist Text.** Keine Information ausschließlich in einer Grafik.

## 4. Farbe

17. Komponenten verwenden **ausschließlich rollenbasierte Tokens**
    (`--accent-ink`, `--field`, `--hover`), nie direkte Farbwerte. Ein `#` in einer
    Komponentendatei ist ein Review-Befund.
18. **Kontrast:** mindestens 4,5:1 für Text, 3:1 für große Schrift, Bedienelemente und
    Fokusringe. Geprüft in **beiden** Darstellungen.
19. **Farbe ist nie der alleinige Bedeutungsträger.** Ein Status braucht zusätzlich
    Symbol oder Beschriftung — Rot allein sagt nichts über Rot-Grün-Schwäche hinaus.
20. Die Dunkeldarstellung ist **gleichwertig**, kein invertierter Nebenprodukt-Modus.
    Jeder neue Zustand wird in beiden Darstellungen geprüft.
21. Die aktuellen Markenfarben sind **vorläufig** (abgeleitet aus dem Vereinslogo, nicht
    freigegeben — siehe F7). Neue Farbwerte kommen nicht hinzu, ohne dass die Rolle
    benannt und der Kontrast belegt ist.

## 5. Komponenten und Zustände

22. **Jede Komponente definiert acht Zustände**, bevor sie als fertig gilt:
    Standard · Hover · Fokus · Aktiv · Deaktiviert · Lädt · Leer · Fehler.
    Ein vergessener Zustand ist ein Defekt, kein Nacharbeitspunkt.
23. **Leerzustände sind gestaltet.** „Noch keine Ankündigungen" mit Erklärung, wann
    welche zu erwarten sind — nicht eine leere Fläche.
24. **Fehlerzustände sagen, was zu tun ist.** „Die Anmeldung konnte nicht gespeichert
    werden. Bitte in einer Minute erneut versuchen — deine Eingaben bleiben erhalten."
    Nie ein technischer Code allein.
25. **Ladezustände ab 300 ms sichtbar**, formgleich zum erwarteten Inhalt. Kein
    Springen des Layouts beim Nachladen.
26. **Kein Zustand wird nur durch Bewegung kommuniziert.**

## 6. Formulare

Der wichtigste und riskanteste Teil der App (Journey J2).

27. **Eine Spalte.** Nebeneinanderstehende Felder nur, wenn sie inhaltlich eine Einheit
    bilden (z. B. PLZ und Ort).
28. **Beschriftungen stehen immer sichtbar über dem Feld.** Ein Platzhalter ist keine
    Beschriftung — er verschwindet genau dann, wenn er gebraucht wird.
29. **Optionale Felder werden markiert, nicht die Pflichtfelder.** Wenn die meisten
    Felder Pflicht sind, ist das die ehrlichere Darstellung.
30. **Jedes Feld hat `autocomplete` und, wo sinnvoll, `inputmode`.** Eine E-Mail-Adresse
    auf dem Smartphone ohne passende Tastatur einzugeben ist vermeidbare Reibung.
31. **Fehler erscheinen am Feld, sobald es verlassen wurde** — nicht erst beim
    Absenden. Beim Absenden zusätzlich eine Zusammenfassung mit Sprungmarken.
32. **Eingaben gehen nie verloren.** Weder bei einem Serverfehler noch beim
    versehentlichen Neuladen. _(Im Entwurf derzeit nicht erfüllt.)_
33. **Jedes erhobene Feld ist begründet.** Produktprinzip 4: Wer die Frage „wofür
    genau?" nicht beantworten kann, streicht das Feld.
34. **Der Absendezustand ist eindeutig.** Der Knopf sperrt nach dem ersten Klick;
    Doppelanmeldungen durch doppeltes Tippen sind ausgeschlossen.

## 7. Bewegung

35. **Bewegung dient der Orientierung**, nie der Dekoration: Sie zeigt, woher etwas kam
    und wohin es geht.
36. **Dauer 150–300 ms.** Alles darüber wird als Verzögerung erlebt.
37. **`prefers-reduced-motion` wird respektiert** — von jeder Animation, ohne Ausnahme.
    _(Im Entwurf an zwei Stellen bereits berücksichtigt.)_
38. **Keine Bewegung blockiert das Lesen oder die Bedienung.** Kein Autoplay, kein
    erzwungenes Zuende-Animieren vor der nächsten Eingabe.

## 8. Barrierefreiheit — Abnahmekriterium, kein Feature

39. **Maßstab ist WCAG 2.2 AA.** Unabhängig davon, wie F12 rechtlich ausgeht.
40. **Alles ist mit der Tastatur bedienbar**, in sinnvoller Reihenfolge, ohne Fallen.
41. **Der Tastaturfokus ist immer sichtbar** (`:focus-visible`), mit mindestens 3:1
    Kontrast zur Umgebung. _(Im Entwurf derzeit nicht vorhanden — die Startseiten-Kacheln
    sind `<button>`-Elemente ohne sichtbaren Fokus.)_
42. **Semantisches HTML vor ARIA.** Ein `<button>` ist einem `<div>` mit Klick-Handler
    immer vorzuziehen. ARIA nur, wo HTML nichts anbietet.
43. **Dynamische Statusmeldungen erreichen Screenreader** (`aria-live`): Anmeldung
    gespeichert, Kontingent erschöpft, Filter geändert. _(Im Entwurf nicht vorhanden.)_
44. **Jede Kernreise wird mindestens einmal manuell mit einem Screenreader geprüft.**
    Automatische Prüfung ersetzt das nicht.
45. **Bilder haben aussagekräftige Alternativtexte**, dekorative Grafiken sind
    `aria-hidden`. _(Das Icon-Sprite im Entwurf macht das bereits richtig.)_
46. **Die App funktioniert bei 200 % Zoom** ohne Informationsverlust.

## 9. Sprache und Inhalt

47. **Durchgängige Ihr-Ansprache** („Hier findet ihr…", „Tippt auf…"). Der Entwurf hält
    das bereits konsequent durch — das bleibt so.
48. **Verständlich statt korrekt-bürokratisch.** „Plätze sind begrenzt" statt
    „Kontingentierung nach Maßgabe der Verfügbarkeit".
49. **Datum und Uhrzeit immer vollständig und eindeutig:** Wochentag, Datum, Uhrzeit mit
    „Uhr". Bei mehrtägigen Programmen nie eine Uhrzeit ohne Tagesbezug.
50. **Platzhalter sind als solche erkennbar** und dürfen nicht veröffentlicht werden.
    Für Impressum und Datenschutzhinweise ist das zusätzlich im Build zu verhindern.
51. **Keine Dark Patterns.** Keine voreingestellten Einwilligungen, kein künstlicher
    Zeitdruck, keine versteckten Abmeldewege. Bei einem Verein ist Vertrauen das
    eigentliche Kapital.

## 10. Leistung als Gestaltungsregel

52. **Budget:** Largest Contentful Paint unter 2,5 s auf einem Mittelklasse-Smartphone
    im 4G-Netz. Konkrete Schwellenwerte nach dem Basislauf (ADR-0008).
53. **JavaScript nur dort, wo Interaktion stattfindet.** Eine Programmliste braucht
    keines.
54. **Bilder werden in moderner Kodierung, in passender Größe und verzögert geladen.**
    Kein Bild wird base64-kodiert eingebettet. _(Im Entwurf derzeit 273 KB so
    eingebettet.)_
55. **Die Programminhalte sind offline verfügbar.** Produktprinzip 3 und Annahme A5.
    Der Service Worker liefert dabei nie veraltete Zeiten aus, ohne es kenntlich zu
    machen.

---

## 11. Zwei Regeln aus konkreten Fehlern

Beide stehen hier, weil sie tatsächlich passiert sind und beim Durchklicken niemandem
aufgefallen wären — gefunden hat sie erst die CI.

56. **Deutschsprachige Oberflächen brauchen Silbentrennung.** `hyphens: auto` plus
    `overflow-wrap: break-word` auf dem Textfluss, und `<html lang="de">` muss gesetzt
    sein, damit der Browser nach deutschen Regeln trennt.
    _Anlass:_ Die Überschrift „Weitere Übernachtungsempfehlungen" war breiter als ein
    320-px-Display und machte die ganze Seite waagerecht scrollbar. In diesem Projekt
    sind lange Zusammensetzungen die Regel — _Altstipendiatentagung_,
    _Zimmerkontingent_, _Mitgliederversammlung_ —, nicht die Ausnahme.

57. **Ein Scrollbereich braucht `position: relative`.** Ein Scrollcontainer beschneidet
    absolut positionierte Nachfahren **nur dann**, wenn er selbst ihr umschließender
    Block ist.
    _Anlass:_ Die Zeitachse klippte korrekt bei 288 px — aber die
    `.nur-vorlesen`-Spannen in den Knöpfen sind `position: absolute` und hingen dadurch
    am Wurzelelement. Ihre statische Position lag bei ~1600 px im Raster, und genau das
    machte die Seite scrollbar. Überall, wo ein Scrollbereich und das
    Screenreader-Muster zusammentreffen, wiederholt sich das.

**Und eine Lehre zur Prüfung selbst:** Regel 10 wird am **Verhalten** geprüft („lässt
sich die Seite schieben?"), nicht an `scrollWidth`. Die Kennzahl war auf der Zeitachse
um 1174 px zu groß, obwohl sich nichts schieben ließ — und in einem anderen Fall
umgekehrt. Der Helfer dafür steht in `tests/e2e/hilfen.ts` und grenzt im Fehlerfall die
Ursache ein, statt sie den Lesenden zu überlassen.

---

## Prüfliste für Pull Requests mit UI-Änderungen

Ergänzend zur Definition of Done in `AGENTS.md`:

- [ ] Screenshots in **Hell- und Dunkeldarstellung**, bei schmalem und breitem Viewport
- [ ] Alle acht Komponentenzustände umgesetzt oder begründet nicht zutreffend (Regel 22)
- [ ] Vollständig mit der Tastatur bedient, Fokus jederzeit sichtbar (Regeln 40, 41)
- [ ] Kontraste in beiden Darstellungen geprüft (Regel 18)
- [ ] Keine direkten Farbwerte, nur Tokens (Regel 17)
- [ ] Bei Formularen: Eingaben überstehen einen Neuladevorgang (Regel 32)
- [ ] axe-core ohne neue Befunde
- [ ] Bei neuen Texten: Ansprache, Datums- und Zeitformate geprüft (Regeln 47, 49)
