/**
 * Das Programmheft als PDF - sobald eine veroeffentlichungsreife Fassung unter
 * src/dokumente/programmheft-2027.pdf liegt. Bis dahin gibt es weder den Link
 * im Programm noch die FAQ-Antwort dazu: kein Verweis ins Leere.
 *
 * Die Arbeitsfassung des Orga-Teams (src/assets/programm/) taugt dafuer nicht:
 * Sie enthaelt private Telefonnummern, Platzhalter und redaktionelle Notizen.
 */
const dateien = import.meta.glob<string>("../dokumente/programmheft-2027.pdf", {
  query: "?url",
  import: "default",
  eager: true,
});

export const PROGRAMMHEFT_URL: string | undefined = Object.values(dateien)[0];

/** Dateiname beim Herunterladen - lesbar statt des Hashes aus dem Build. */
export const PROGRAMMHEFT_DATEINAME = "Programmheft-Jahrestagung-2027.pdf";
