# Architekturentscheidungen (ADR)

Jede wesentliche Entscheidung bekommt eine eigene, fortlaufend nummerierte Datei.
Ein ADR hält fest, **warum** etwas so entschieden wurde — und was dagegen sprach.
Das ist der Teil, der beim Nachlesen in einem Jahr zählt und den der Code nicht erzählt.

## Status

| Status                      | Bedeutung                                                         |
| --------------------------- | ----------------------------------------------------------------- |
| **Vorgeschlagen**           | Entwurf, noch nicht gemeinsam bestätigt. Nicht umsetzungsleitend. |
| **Angenommen**              | Gilt. Abweichungen brauchen ein neues ADR.                        |
| **Abgelöst durch ADR-XXXX** | Historisch. Datei bleibt bestehen, wird nicht gelöscht.           |
| **Zurückgezogen**           | Verworfen, ohne Nachfolger.                                       |

Ein angenommenes ADR wird **nie überschrieben**. Ändert sich die Entscheidung, entsteht
ein neues ADR, und das alte erhält den Status „Abgelöst durch".

## Ablauf

1. Neue Datei aus `0000-vorlage.md`, nächste freie Nummer, Status „Vorgeschlagen".
2. Im Pull Request gemeinsam besprechen — ein ADR ist reviewpflichtig wie Code.
3. Beide Entwickler einverstanden → Status auf „Angenommen", Datum setzen, mergen.

## Übersicht

| Nr.                                     | Titel                                                | Status        |
| --------------------------------------- | ---------------------------------------------------- | ------------- |
| [0001](0001-adr-prozess.md)             | ADR-Prozess und Dokumentationsstruktur               | Angenommen    |
| [0002](0002-plattform-pwa.md)           | Plattform: installierbare Web-App statt nativer Apps | Vorgeschlagen |
| [0003](0003-frontend-architektur.md)    | Vom Einzeldatei-Entwurf zu einer gebauten Anwendung  | Angenommen    |
| [0004](0004-serverseitige-anmeldung.md) | Anmeldung und Kontingente serverseitig               | Vorgeschlagen |
| [0005](0005-zugang-ohne-konten.md)      | Zugang ohne Benutzerkonten                           | Vorgeschlagen |
| [0006](0006-inhalte-als-daten.md)       | Tagungsinhalte als versionierte Daten                | Vorgeschlagen |
| [0007](0007-designsystem.md)            | Designsystem auf rollenbasierten Tokens              | Vorgeschlagen |
| [0008](0008-teststrategie.md)           | Teststrategie und Zuschnitt der CI                   | Vorgeschlagen |
| [0009](0009-fotos-auf-sharepoint.md)    | Tagungsfotos auf dem SharePoint des Vereins          | Angenommen    |
