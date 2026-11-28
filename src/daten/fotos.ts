/**
 * Adresse des Fotoalbums im OneDrive des Vereins (ADR-0009, Nachtrag
 * 28.11.2026). Solange sie fehlt, zeigt "Fotos" keinen Knopf und die FAQ
 * keine Antwort, die auf das Album verweist - kein Verweis ins Leere.
 */
export const FOTOALBUM_URL: string | null = null;

/**
 * Hinweis zur Fotografie, Wortlaut des Orga-Teams vom 28.11.2026. Er ist auch
 * Bestandteil der Anmeldung (Microsoft Forms) und muss mit ihr übereinstimmen.
 * Er steht auf "Anmeldung", "Fotos" und in der FAQ (geprüft in faq.test.ts).
 */
export const FOTOHINWEIS =
  "Die Veranstaltung wird fotografisch begleitet. Die Teilnehmenden erklären mit der Anmeldung ihr Einverständnis, dass der Altstipendiaten der Konrad-Adenauer-Stiftung e.V. das vor, während oder nach der Veranstaltung entstandene Fotomaterial für Zwecke der Presse- und Öffentlichkeitsarbeit nutzt.";
