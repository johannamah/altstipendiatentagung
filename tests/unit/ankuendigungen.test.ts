import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  abfrageAdresse,
  formatiereZeitpunkt,
  ladeAnkuendigungen,
  ladeKopie,
  pruefeAntwort,
  speichereKopie,
  type Ankuendigung,
} from "../../src/lib/ankuendigungen.ts";

/** Ein Speicher wie localStorage, ohne Browser. */
function speicher(start: Record<string, string> = {}) {
  const inhalt = new Map(Object.entries(start));
  return {
    getItem: (schluessel: string) => inhalt.get(schluessel) ?? null,
    setItem: (schluessel: string, wert: string) => void inhalt.set(schluessel, wert),
  };
}

const zeile = (ueberschreiben: Record<string, unknown> = {}) => ({
  id: "a1",
  titel: "Raumänderung",
  text: "Der Vortrag findet im Saal 2 statt.",
  gewicht: "info",
  veroeffentlicht_am: "2026-11-20T09:00:00+00:00",
  ...ueberschreiben,
});

const KONFIGURATION = { url: "https://projekt.supabase.co", schluessel: "sb_publishable_test" };

describe("Abfrage", () => {
  it("fragt nur die benoetigten Spalten ab, neueste zuerst", () => {
    const adresse = new URL(abfrageAdresse("https://projekt.supabase.co/"));

    expect(adresse.origin + adresse.pathname).toBe(
      "https://projekt.supabase.co/rest/v1/ankuendigungen",
    );
    expect(adresse.searchParams.get("select")).toBe("id,titel,text,gewicht,veroeffentlicht_am");
    expect(adresse.searchParams.get("order")).toBe("veroeffentlicht_am.desc");
  });

  /**
   * Der veroeffentlichbare Schluessel gehoert in "apikey". Als Bearer-Token
   * gesendet lehnt Supabase ihn ab, weil er kein JWT ist.
   */
  it("schickt den Schluessel als apikey und sonst nichts", async () => {
    const abruf = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));

    await ladeAnkuendigungen(KONFIGURATION, abruf);

    const [, optionen] = abruf.mock.calls[0]!;
    expect(optionen.headers).toEqual({ apikey: "sb_publishable_test" });
  });

  it("liefert die Ankuendigungen aus der Antwort", async () => {
    const abruf = vi.fn().mockResolvedValue(Response.json([zeile()]));

    const liste = await ladeAnkuendigungen(KONFIGURATION, abruf);

    expect(liste).toEqual([
      {
        id: "a1",
        titel: "Raumänderung",
        text: "Der Vortrag findet im Saal 2 statt.",
        gewicht: "info",
        veroeffentlichtAm: "2026-11-20T09:00:00+00:00",
      },
    ]);
  });

  it("meldet einen Fehler, wenn Supabase nicht mit Erfolg antwortet", async () => {
    const abruf = vi.fn().mockResolvedValue(new Response("{}", { status: 503 }));

    await expect(ladeAnkuendigungen(KONFIGURATION, abruf)).rejects.toThrow(/503/);
  });
});

describe("Pruefung der Antwort", () => {
  it("sortiert neueste zuerst, auch wenn die Antwort es nicht tut", () => {
    const liste = pruefeAntwort([
      zeile({ id: "alt", veroeffentlicht_am: "2026-11-01T08:00:00Z" }),
      zeile({ id: "neu", veroeffentlicht_am: "2026-11-21T08:00:00Z" }),
    ]);

    expect(liste.map((a) => a.id)).toEqual(["neu", "alt"]);
  });

  /** Eine kaputte Zeile darf die uebrigen Ankuendigungen nicht verdecken. */
  it("laesst unvollstaendige Zeilen weg", () => {
    const liste = pruefeAntwort([
      zeile({ id: "gut" }),
      zeile({ id: "leer", titel: "  " }),
      { id: 3 },
    ]);

    expect(liste.map((a) => a.id)).toEqual(["gut"]);
  });

  it("behandelt ein unbekanntes Gewicht als Information", () => {
    expect(pruefeAntwort([zeile({ gewicht: "dringend" })])[0]?.gewicht).toBe("info");
    expect(pruefeAntwort([zeile({ gewicht: "wichtig" })])[0]?.gewicht).toBe("wichtig");
  });

  it("lehnt eine Antwort ab, die keine Liste ist", () => {
    expect(() => pruefeAntwort({ message: "Fehler" })).toThrow();
  });
});

describe("Kopie fuer unterwegs", () => {
  const liste: Ankuendigung[] = [
    {
      id: "a1",
      titel: "Raumänderung",
      text: "Saal 2",
      gewicht: "wichtig",
      veroeffentlichtAm: "2026-11-20T09:00:00Z",
    },
  ];

  it("gibt die zuletzt geladenen Ankuendigungen mit ihrem Stand zurueck", () => {
    const geraet = speicher();

    speichereKopie(geraet, liste, new Date("2026-11-22T10:15:00Z"));

    expect(ladeKopie(geraet)).toEqual({ stand: "2026-11-22T10:15:00.000Z", ankuendigungen: liste });
  });

  it("ist leer, solange nichts gespeichert wurde", () => {
    expect(ladeKopie(speicher())).toBeNull();
  });

  it("ignoriert einen unlesbaren Eintrag", () => {
    expect(ladeKopie(speicher({ ankuendigungen: "{kaputt" }))).toBeNull();
  });

  /** Privates Fenster oder gesperrte Website-Daten: Die Seite muss trotzdem laufen. */
  it("kommt ohne nutzbaren Speicher aus", () => {
    const gesperrt = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(() => speichereKopie(gesperrt, liste, new Date())).not.toThrow();
    expect(ladeKopie(gesperrt)).toBeNull();
    expect(ladeKopie(null)).toBeNull();
  });
});

describe("Datum", () => {
  /** 23:30 Uhr UTC ist in Hildesheim schon der naechste Tag. */
  it("zeigt Tag und Uhrzeit in deutscher Zeit", () => {
    expect(formatiereZeitpunkt("2026-11-21T23:30:00Z")).toBe(
      "Sonntag, 22. November 2026, 00:30 Uhr",
    );
  });
});

/**
 * Die Datenbank ist von aussen erreichbar; der veroeffentlichbare Schluessel
 * steht in jedem Browser. Schutz bietet allein die Migration.
 */
describe("Datenbankmigration", () => {
  const verzeichnis = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
  const sql = readdirSync(verzeichnis)
    .filter((datei) => datei.endsWith(".sql"))
    .map((datei) => readFileSync(`${verzeichnis}/${datei}`, "utf8"))
    .join("\n")
    .toLowerCase();

  it("schaltet Row Level Security fuer die Ankuendigungen ein", () => {
    expect(sql).toContain("alter table public.ankuendigungen enable row level security");
  });

  it("gibt anonymen Besuchern nur Leserechte", () => {
    expect(sql).toMatch(/revoke all on table public\.ankuendigungen from anon, authenticated/);
    expect(sql).toMatch(/grant select on table public\.ankuendigungen to anon, authenticated/);
    expect(sql).not.toMatch(/grant (insert|update|delete|all)[^;]* to [^;]*anon/);
  });

  it("zeigt nur Ankuendigungen, die sichtbar geschaltet sind", () => {
    expect(sql).toMatch(/for select\s+to anon, authenticated\s+using \(sichtbar\)/);
  });
});
