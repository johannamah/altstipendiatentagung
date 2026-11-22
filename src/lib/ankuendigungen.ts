/**
 * Ankuendigungen aus Supabase (ADR-0014).
 *
 * Der Browser fragt die REST-Schnittstelle direkt ab - ohne Supabase-SDK: Fuer
 * eine einzige lesende Abfrage waere es ein Vielfaches an Code, der auf jedem
 * Smartphone geladen wird. Der Schluessel ist der veroeffentlichbare; was er
 * lesen darf, regelt allein Row Level Security in der Migration.
 *
 * Bewusst ohne DOM: Die Seite stellt dar, hier steht, was sich ohne Browser
 * pruefen laesst.
 */

export type Gewicht = "wichtig" | "info";

export interface Ankuendigung {
  readonly id: string;
  readonly titel: string;
  readonly text: string;
  readonly gewicht: Gewicht;
  /** ISO-Zeitpunkt, wie Supabase ihn liefert. */
  readonly veroeffentlichtAm: string;
}

export interface Verbindung {
  /** Projektadresse, z. B. https://abcd.supabase.co */
  readonly url: string;
  /** Veroeffentlichbarer Schluessel (sb_publishable_... oder der alte anon-Schluessel). */
  readonly schluessel: string;
}

/** Der Ausschnitt von localStorage, den wir brauchen. */
export interface Speicher {
  getItem(schluessel: string): string | null;
  setItem(schluessel: string, wert: string): void;
  removeItem?(schluessel: string): void;
}

export interface Kopie {
  /** Zeitpunkt des Ladens als ISO-Zeitpunkt. */
  readonly stand: string;
  readonly ankuendigungen: Ankuendigung[];
}

export const SPEICHERSCHLUESSEL = "ankuendigungen";

/** Langsames Netz am Tagungsort: lieber frueh auf die Kopie ausweichen als warten. */
const ZEITLIMIT_MS = 8000;

export function abfrageAdresse(basis: string): string {
  const adresse = new URL("rest/v1/ankuendigungen", basis.replace(/\/*$/, "/"));
  adresse.searchParams.set("select", "id,titel,text,gewicht,veroeffentlicht_am");
  adresse.searchParams.set("order", "veroeffentlicht_am.desc");
  return adresse.toString();
}

export async function ladeAnkuendigungen(
  verbindung: Verbindung,
  abruf: typeof fetch = fetch,
): Promise<Ankuendigung[]> {
  const antwort = await abruf(abfrageAdresse(verbindung.url), {
    headers: { apikey: verbindung.schluessel },
    signal: AbortSignal.timeout(ZEITLIMIT_MS),
  });

  if (!antwort.ok) {
    throw new Error(`Supabase antwortet mit ${antwort.status}`);
  }

  return pruefeAntwort(await antwort.json());
}

const istText = (wert: unknown): wert is string => typeof wert === "string" && wert.trim() !== "";

/**
 * Nimmt nur Zeilen, die sich vollstaendig darstellen lassen. Die Datenbank
 * prueft dasselbe bereits - aber was im Browser ankommt, ist eine Eingabe.
 */
export function pruefeAntwort(daten: unknown): Ankuendigung[] {
  if (!Array.isArray(daten)) {
    throw new Error("Unerwartete Antwort: keine Liste");
  }

  const liste: Ankuendigung[] = [];
  for (const zeile of daten as Record<string, unknown>[]) {
    if (typeof zeile !== "object" || zeile === null) continue;
    const { id, titel, text, gewicht, veroeffentlicht_am: zeitpunkt } = zeile;
    if (!istText(id) || !istText(titel) || !istText(text) || !istText(zeitpunkt)) continue;
    if (Number.isNaN(Date.parse(zeitpunkt))) continue;

    liste.push({
      id,
      titel,
      text,
      gewicht: gewicht === "wichtig" ? "wichtig" : "info",
      veroeffentlichtAm: zeitpunkt,
    });
  }

  // Neueste zuerst - bei Aenderungen am Programm zaehlt, was zuletzt kam.
  return liste.sort((a, b) => Date.parse(b.veroeffentlichtAm) - Date.parse(a.veroeffentlichtAm));
}

export function speichereKopie(
  speicher: Speicher | null,
  ankuendigungen: Ankuendigung[],
  jetzt: Date,
): void {
  try {
    speicher?.setItem(
      SPEICHERSCHLUESSEL,
      JSON.stringify({ stand: jetzt.toISOString(), ankuendigungen }),
    );
  } catch {
    /* Ohne Speicher gibt es eben keine Kopie fuer unterwegs. */
  }
}

export function ladeKopie(speicher: Speicher | null): Kopie | null {
  try {
    const roh = speicher?.getItem(SPEICHERSCHLUESSEL);
    if (!roh) return null;

    const { stand, ankuendigungen } = JSON.parse(roh) as Partial<Kopie>;
    if (!istText(stand) || !Array.isArray(ankuendigungen)) return null;

    // Durch dieselbe Pruefung wie eine frische Antwort: Der Speicher kann von
    // einer aelteren Version der App stammen.
    const geprueft = pruefeAntwort(
      ankuendigungen.map((a) => ({ ...a, veroeffentlicht_am: a.veroeffentlichtAm })),
    );
    return { stand, ankuendigungen: geprueft };
  } catch {
    return null;
  }
}

const zeitformat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

/** Die Tagung findet in Hildesheim statt - massgeblich ist deutsche Zeit. */
export function formatiereZeitpunkt(iso: string): string {
  return `${zeitformat.format(new Date(iso)).replace(" um ", ", ")} Uhr`;
}
