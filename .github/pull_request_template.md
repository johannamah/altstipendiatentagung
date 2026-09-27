## Kontext

<!-- Welches Issue, welches Problem? Verknüpfe das Issue: "Schließt #123" -->

## Umsetzung

<!-- Was wurde geändert, und warum so? Abgelehnte Alternativen gehören in ein ADR. -->

## Testnachweise

<!-- Befehle UND Ergebnisse, nicht nur "getestet". AGENTS.md verlangt das ausdrücklich. -->

```
npm run pruefen
```

<!-- Falls etwas nicht automatisiert prüfbar war: begründen und die manuelle
     Prüfanleitung hier angeben. -->

## Bei UI-Änderungen

<!-- Ohne UI-Änderung diesen Abschnitt löschen. Regeln: docs/ui-ux-designregeln.md -->

- [ ] Screenshots in **heller und dunkler** Darstellung, bei **schmalem und breitem** Viewport
- [ ] Alle acht Komponentenzustände umgesetzt oder begründet nicht zutreffend (Regel 22)
- [ ] Vollständig mit der Tastatur bedient, Fokus jederzeit sichtbar (Regeln 40, 41)
- [ ] Kontraste in beiden Darstellungen geprüft (Regel 18)
- [ ] Keine direkten Farbwerte, nur Tokens (Regel 17)
- [ ] Bei Formularen: Eingaben überstehen einen Neuladevorgang (Regel 32)
- [ ] axe-core ohne neue Befunde
- [ ] Ansprache, Datums- und Zeitformate geprüft (Regeln 47, 49)

## Offene Punkte und Risiken

<!-- Getroffene Annahmen, bekannte Lücken, was bewusst nicht gemacht wurde.
     Neue offene Fragen gehören zusätzlich nach docs/offene-fragen.md. -->

## Review

<!-- AGENTS.md: unabhängige Modellprüfung (bevorzugt Codex) UND Freigabe durch die
     zweite Person. Es merged nicht, wer entwickelt hat. -->
