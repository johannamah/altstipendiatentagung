/**
 * "Mein Programm": die persoenliche Auswahl von Programmpunkten.
 *
 * Die Auswahl liegt ausschliesslich im Browser des Geraets. Sie erreicht weder
 * andere Geraete noch uns - das muss in der Oberflaeche stehen, sonst rechnen
 * Nutzende damit, sie auf dem Laptop wiederzufinden.
 *
 * Der Speicher wird uebergeben statt direkt angesprochen: So laesst sich das
 * Verhalten ohne Browser testen, auch der Fall, dass der Zugriff wirft.
 */

export const SPEICHERSCHLUESSEL = "mein-programm";

/** Der Ausschnitt von localStorage, den wir brauchen. */
export interface Speicher {
  getItem(schluessel: string): string | null;
  setItem(schluessel: string, wert: string): void;
  removeItem(schluessel: string): void;
}

/**
 * Liefert localStorage, oder null, wenn es nicht zur Verfuegung steht.
 * Schon der Zugriff auf die Eigenschaft kann werfen.
 */
export function browserSpeicher(): Speicher | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Liest die gespeicherte Auswahl.
 *
 * `bekannteIds` filtert Kennungen heraus, die es nicht mehr gibt: Wird ein
 * Programmpunkt umbenannt oder abgesagt, soll die Ansicht trotzdem
 * funktionieren.
 */
export function ladeAuswahl(speicher: Speicher | null, bekannteIds: readonly string[]): string[] {
  if (!speicher) return [];

  let roh: string | null;
  try {
    roh = speicher.getItem(SPEICHERSCHLUESSEL);
  } catch {
    return [];
  }

  if (!roh) return [];

  try {
    const gelesen: unknown = JSON.parse(roh);
    if (!Array.isArray(gelesen)) return [];

    return gelesen.filter(
      (eintrag): eintrag is string => typeof eintrag === "string" && bekannteIds.includes(eintrag),
    );
  } catch {
    return [];
  }
}

/** Schreibt die Auswahl. Meldet, ob es gelungen ist. */
export function speichereAuswahl(speicher: Speicher | null, ids: readonly string[]): boolean {
  if (!speicher) return false;

  try {
    if (ids.length === 0) speicher.removeItem(SPEICHERSCHLUESSEL);
    else speicher.setItem(SPEICHERSCHLUESSEL, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

/** Fuegt hinzu oder entfernt - ohne die uebergebene Liste zu veraendern. */
export function umschalten(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((vorhanden) => vorhanden !== id) : [...ids, id];
}
