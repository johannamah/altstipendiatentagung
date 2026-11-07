/**
 * Zerlegt einen gepflegten Text an Leerzeilen in Absaetze.
 *
 * In den JSON-Inhalten steht ein Absatzwechsel als "\n\n" - so bleibt ein
 * Text ein einziges Feld, und das Orga-Team muss keine Liste pflegen.
 */
export function inAbsaetze(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((absatz) => absatz.trim())
    .filter((absatz) => absatz.length > 0);
}
