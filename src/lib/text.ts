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

/**
 * Macht aus einer Telefonnummer, wie sie in Unterlagen steht, einen waehlbaren
 * tel:-Verweis. Schreibweisen wie "+49 (0) 51 21 – 179 29 0" sind ueblich, aber
 * als Verweis unbrauchbar: Die "(0)" darf nach der Laendervorwahl nicht
 * gewaehlt werden, Striche und Leerzeichen stoeren manche Telefon-Apps.
 * Nummern ohne Laendervorwahl gelten als deutsche.
 */
export function telefonVerweis(nummer: string): string {
  let ziffern = nummer.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
  if (ziffern.startsWith("00")) ziffern = `+${ziffern.slice(2)}`;
  else if (ziffern.startsWith("0")) ziffern = `+49${ziffern.slice(1)}`;
  return `tel:${ziffern}`;
}
