# Archiv: der ursprüngliche Einzeldatei-Entwurf

`index.html` ist der erste Entwurf der Tagungs-App: eine eigenständige Datei ohne
Build-Werkzeuge, die per Doppelklick lief. Sie hat ihren Zweck erfüllt — sie hat
gezeigt, dass der inhaltliche Zuschnitt trägt, und dient als Referenz, solange noch
nicht alle Ansichten in die Anwendung unter `src/` überführt sind.

**Sie wird nicht weiterentwickelt.** Begründung in
[ADR-0003](../docs/decisions/0003-frontend-architektur.md). Wer etwas ändern will,
ändert es in der Anwendung, nicht hier.

## Ansehen

Die Datei ist von Prettier und ESLint ausgenommen, damit ihr Diff lesbar bleibt, und
wird nicht mitgebaut. Zum Ansehen genügt ein statischer Server im Wurzelverzeichnis
des Projekts, etwa:

```bash
npx serve .
# dann http://localhost:3000/archiv/
```

## Was gegenüber dem Original geändert wurde

Nur zwei Dinge, beide ohne Auswirkung auf Inhalt oder Verhalten:

1. **Die beiden Logos sind keine base64-Daten mehr.** Sie lagen als 220 KB und 53 KB
   direkt in der Datei — rund 74 % ihrer Größe, und das Browserfenster blieb so lange
   leer. Jetzt verweisen sie auf `../public/`, wo die Bilddateien ohnehin liegen.
   Die Datei ist dadurch von 370 KB auf 97 KB geschrumpft.

   **Preis:** Der ursprüngliche Zweck der Einbettung war, dass die Datei _allein_
   funktioniert. Das tut sie nicht mehr — sie braucht jetzt den `public/`-Ordner
   daneben. Das ist vertretbar, weil sie ohnehin nur noch im Repository betrachtet
   wird und nicht mehr weitergegeben wird.

2. **Die Icon- und Manifest-Pfade wurden korrigiert.** Sie zeigten auf ein
   `assets/`-Verzeichnis, das es im Repository nie gab — „Zum Homescreen hinzufügen"
   lieferte deshalb kein Icon.
