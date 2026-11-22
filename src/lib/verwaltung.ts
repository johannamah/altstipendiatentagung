/**
 * Verwaltung der Ankuendigungen durch die Admins (ADR-0014).
 *
 * Anmeldung und Schreibzugriffe gehen wie das Lesen direkt an die
 * Schnittstellen von Supabase, ohne SDK. Was ein Konto darf, entscheidet allein
 * Row Level Security in der Datenbank; hier wird nur verstaendlich gemeldet,
 * was sie ablehnt.
 *
 * Bewusst ohne DOM: Die Seite stellt dar, hier steht, was sich ohne Browser
 * pruefen laesst.
 */

import type { Ankuendigung, Gewicht, Speicher, Verbindung } from "./ankuendigungen.ts";

export interface Sitzung {
  readonly zugriff: string;
  readonly erneuerung: string;
  /** Ablauf des Zugriffstokens in Sekunden seit 1970. */
  readonly ablauf: number;
  readonly nutzerId: string;
  readonly email: string;
}

export interface VerwalteteAnkuendigung extends Ankuendigung {
  readonly sichtbar: boolean;
}

export interface Entwurf {
  readonly titel: string;
  readonly text: string;
  readonly gewicht: Gewicht;
  readonly sichtbar: boolean;
}

export type Fehlerart = "anmeldung" | "abgelaufen" | "berechtigung" | "dienst";

export class VerwaltungsFehler extends Error {
  constructor(
    readonly art: Fehlerart,
    nachricht: string,
  ) {
    super(nachricht);
    this.name = "VerwaltungsFehler";
  }
}

/** Dieselben Grenzen wie die Pruefbedingungen der Tabelle. */
export const GRENZEN = { titel: 200, text: 5000 } as const;

const PUFFER_SEKUNDEN = 60;

/** sessionStorage: Die Anmeldung endet mit dem Tab - wichtig auf fremden Geraeten. */
export const SITZUNGSSCHLUESSEL = "verwaltung-sitzung";

const adresse = (verbindung: Verbindung, pfad: string) =>
  new URL(pfad, verbindung.url.replace(/\/*$/, "/"));

function kopf(verbindung: Verbindung, sitzung?: Sitzung): Record<string, string> {
  return {
    apikey: verbindung.schluessel,
    "Content-Type": "application/json",
    ...(sitzung ? { Authorization: `Bearer ${sitzung.zugriff}` } : {}),
  };
}

async function pruefeStatus(antwort: Response, beiAnmeldung = false): Promise<void> {
  if (antwort.ok) return;

  if (beiAnmeldung && (antwort.status === 400 || antwort.status === 401)) {
    throw new VerwaltungsFehler("anmeldung", "E-Mail-Adresse oder Passwort stimmen nicht.");
  }
  if (antwort.status === 401) {
    throw new VerwaltungsFehler("abgelaufen", "Die Anmeldung ist abgelaufen.");
  }
  if (antwort.status === 403) {
    throw new VerwaltungsFehler("berechtigung", "Dieses Konto darf das nicht.");
  }
  throw new VerwaltungsFehler("dienst", `Supabase antwortet mit ${antwort.status}.`);
}

interface Tokenantwort {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string };
}

function alsSitzung(daten: Tokenantwort, email: string): Sitzung {
  return {
    zugriff: daten.access_token,
    erneuerung: daten.refresh_token,
    ablauf: daten.expires_at,
    nutzerId: daten.user.id,
    email: daten.user.email ?? email,
  };
}

async function token(
  verbindung: Verbindung,
  art: "password" | "refresh_token",
  rumpf: Record<string, string>,
  abruf: typeof fetch,
): Promise<Tokenantwort> {
  const ziel = adresse(verbindung, "auth/v1/token");
  ziel.searchParams.set("grant_type", art);

  const antwort = await abruf(ziel.toString(), {
    method: "POST",
    headers: kopf(verbindung),
    body: JSON.stringify(rumpf),
  });
  await pruefeStatus(antwort, true);
  return (await antwort.json()) as Tokenantwort;
}

export async function anmelden(
  verbindung: Verbindung,
  email: string,
  passwort: string,
  abruf: typeof fetch = fetch,
): Promise<Sitzung> {
  const bereinigt = email.trim();
  const daten = await token(
    verbindung,
    "password",
    { email: bereinigt, password: passwort },
    abruf,
  );
  return alsSitzung(daten, bereinigt);
}

export async function erneuern(
  verbindung: Verbindung,
  sitzung: Sitzung,
  abruf: typeof fetch = fetch,
): Promise<Sitzung> {
  try {
    const daten = await token(
      verbindung,
      "refresh_token",
      { refresh_token: sitzung.erneuerung },
      abruf,
    );
    return alsSitzung(daten, sitzung.email);
  } catch (fehler) {
    // Ein ungueltiges Erneuerungstoken heisst: neu anmelden.
    if (fehler instanceof VerwaltungsFehler && fehler.art === "anmeldung") {
      throw new VerwaltungsFehler("abgelaufen", "Die Anmeldung ist abgelaufen.");
    }
    throw fehler;
  }
}

export function laeuftAb(sitzung: Sitzung, jetzt: Date): boolean {
  return sitzung.ablauf - PUFFER_SEKUNDEN <= jetzt.getTime() / 1000;
}

export async function abmelden(
  verbindung: Verbindung,
  sitzung: Sitzung,
  abruf: typeof fetch = fetch,
): Promise<void> {
  // Bestmoeglich: Auch wenn Supabase nicht antwortet, ist die Sitzung lokal weg.
  await abruf(adresse(verbindung, "auth/v1/logout").toString(), {
    method: "POST",
    headers: kopf(verbindung, sitzung),
  }).catch(() => undefined);
}

export async function istAdmin(
  verbindung: Verbindung,
  sitzung: Sitzung,
  abruf: typeof fetch = fetch,
): Promise<boolean> {
  const antwort = await abruf(
    adresse(verbindung, "rest/v1/rpc/ist_ankuendigungen_admin").toString(),
    {
      method: "POST",
      headers: kopf(verbindung, sitzung),
      body: "{}",
    },
  );
  await pruefeStatus(antwort);
  return (await antwort.json()) === true;
}

export async function ladeAlle(
  verbindung: Verbindung,
  sitzung: Sitzung,
  abruf: typeof fetch = fetch,
): Promise<VerwalteteAnkuendigung[]> {
  const ziel = adresse(verbindung, "rest/v1/ankuendigungen");
  ziel.searchParams.set("select", "id,titel,text,gewicht,sichtbar,veroeffentlicht_am");
  ziel.searchParams.set("order", "veroeffentlicht_am.desc");

  const antwort = await abruf(ziel.toString(), { headers: kopf(verbindung, sitzung) });
  await pruefeStatus(antwort);

  const zeilen = (await antwort.json()) as Record<string, unknown>[];
  return zeilen.map((zeile) => ({
    id: String(zeile.id),
    titel: String(zeile.titel ?? ""),
    text: String(zeile.text ?? ""),
    gewicht: zeile.gewicht === "wichtig" ? "wichtig" : "info",
    sichtbar: zeile.sichtbar === true,
    veroeffentlichtAm: String(zeile.veroeffentlicht_am ?? ""),
  }));
}

async function schreibe(
  verbindung: Verbindung,
  sitzung: Sitzung,
  methode: "POST" | "PATCH" | "DELETE",
  id: string | null,
  rumpf: object | undefined,
  abruf: typeof fetch,
): Promise<void> {
  const ziel = adresse(verbindung, "rest/v1/ankuendigungen");
  if (id !== null) ziel.searchParams.set("id", `eq.${id}`);

  const antwort = await abruf(ziel.toString(), {
    method: methode,
    headers: kopf(verbindung, sitzung),
    ...(rumpf ? { body: JSON.stringify(rumpf) } : {}),
  });
  await pruefeStatus(antwort);
}

/** Legt an (id = null) oder aendert die Ankuendigung mit dieser Kennung. */
export async function speichere(
  verbindung: Verbindung,
  sitzung: Sitzung,
  entwurf: Entwurf,
  id: string | null,
  abruf: typeof fetch = fetch,
): Promise<void> {
  const rumpf = {
    titel: entwurf.titel.trim(),
    text: entwurf.text.trim(),
    gewicht: entwurf.gewicht,
    sichtbar: entwurf.sichtbar,
  };
  await schreibe(verbindung, sitzung, id === null ? "POST" : "PATCH", id, rumpf, abruf);
}

export async function setzeSichtbar(
  verbindung: Verbindung,
  sitzung: Sitzung,
  id: string,
  sichtbar: boolean,
  abruf: typeof fetch = fetch,
): Promise<void> {
  await schreibe(verbindung, sitzung, "PATCH", id, { sichtbar }, abruf);
}

export async function loesche(
  verbindung: Verbindung,
  sitzung: Sitzung,
  id: string,
  abruf: typeof fetch = fetch,
): Promise<void> {
  await schreibe(verbindung, sitzung, "DELETE", id, undefined, abruf);
}

export function pruefeEntwurf(entwurf: Entwurf): Partial<Record<"titel" | "text", string>> {
  const fehler: Partial<Record<"titel" | "text", string>> = {};
  const titel = entwurf.titel.trim();
  const text = entwurf.text.trim();

  if (titel === "") fehler.titel = "Bitte einen Titel eingeben.";
  else if (titel.length > GRENZEN.titel)
    fehler.titel = `Der Titel darf höchstens ${GRENZEN.titel} Zeichen lang sein.`;

  if (text === "") fehler.text = "Bitte einen Text eingeben.";
  else if (text.length > GRENZEN.text)
    fehler.text = `Der Text darf höchstens ${GRENZEN.text} Zeichen lang sein.`;

  return fehler;
}

export function sitzungLaden(speicher: Speicher | null): Sitzung | null {
  try {
    const roh = speicher?.getItem(SITZUNGSSCHLUESSEL);
    if (!roh) return null;
    const sitzung = JSON.parse(roh) as Partial<Sitzung>;
    return typeof sitzung.zugriff === "string" &&
      typeof sitzung.erneuerung === "string" &&
      typeof sitzung.ablauf === "number" &&
      typeof sitzung.nutzerId === "string"
      ? (sitzung as Sitzung)
      : null;
  } catch {
    return null;
  }
}

export function sitzungSpeichern(speicher: Speicher | null, sitzung: Sitzung | null): void {
  try {
    if (sitzung) speicher?.setItem(SITZUNGSSCHLUESSEL, JSON.stringify(sitzung));
    else speicher?.removeItem?.(SITZUNGSSCHLUESSEL);
  } catch {
    /* Ohne Speicher gilt die Anmeldung nur bis zum Neuladen. */
  }
}
