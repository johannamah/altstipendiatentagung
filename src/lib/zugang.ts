import { createHash } from "node:crypto";

/**
 * Zugangssperre beim ersten Abruf (ADR-0010).
 *
 * Wichtig fuer das Verstaendnis: Das ist eine Sichtbarkeitsbarriere, damit die
 * unfertige App nicht zufaellig gefunden oder weitergereicht wird - und kein
 * Zugriffsschutz. Die Seiten sind statisch; ihr HTML steht im Antwortkoerper,
 * bevor irgendein Skript laeuft. Wer `curl` bedienen kann, kommt daran vorbei.
 *
 * Echter Schutz gehoert auf den Server (HTTP-Basisauthentifizierung beim
 * Hoster). Das setzt die Entscheidung zu F2/F11 voraus und steht deshalb noch
 * aus.
 *
 * Das Zugangswort selbst kommt aus der Umgebungsvariablen ZUGANGSWORT und NIE
 * aus dem Repository: Das Repository ist oeffentlich, und ein Wort im Klartext
 * waere mit dem Commit veroeffentlicht. In das gebaute Ergebnis gelangt nur der
 * Hashwert.
 */

/**
 * Projektweites Salz. Es darf oeffentlich sein - seine Aufgabe ist allein, das
 * Nachschlagen in vorberechneten Hashtabellen auszuschliessen. Aendert es sich,
 * werden alle gespeicherten Freischaltungen ungueltig.
 */
export const SALZ = "asev-jahrestagung-2027";

/**
 * @param wort Das konfigurierte Zugangswort, oder undefined/leer, wenn keine
 *   Sperre gewuenscht ist.
 * @returns Hexadezimaler SHA-256-Wert, oder null fuer "Sperre aus".
 */
export function zugangshash(wort: string | undefined): string | null {
  /* NFC, weil "ö" in Unicode zwei Schreibweisen hat: als ein Zeichen oder als
     o + Trema. Eine macOS-Tastatur und eine Windows-Tastatur koennen dabei
     verschieden ausfallen - ohne Vereinheitlichung passt derselbe Umlaut dann
     nicht zu sich selbst. */
  const bereinigt = wort?.trim().normalize("NFC");
  if (!bereinigt) return null;

  return createHash("sha256").update(`${SALZ}:${bereinigt}`, "utf8").digest("hex");
}

/**
 * Liest das Zugangswort aus der Umgebung des Bauvorgangs.
 *
 * Beide Quellen, weil beide Wege vorkommen: `ZUGANGSWORT=… npm run build` in
 * der Schale und ein Eintrag in `.env` fuer die taegliche Arbeit.
 */
export function zugangshashAusUmgebung(): string | null {
  const ausProzess = typeof process !== "undefined" ? process.env.ZUGANGSWORT : undefined;
  const ausVite = import.meta.env?.ZUGANGSWORT as string | undefined;

  return zugangshash(ausProzess ?? ausVite);
}
