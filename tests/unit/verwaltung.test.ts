import { describe, expect, it, vi } from "vitest";

import {
  anmelden,
  erneuern,
  istAdmin,
  ladeAlle,
  laeuftAb,
  loesche,
  pruefeEntwurf,
  setzeSichtbar,
  speichere,
  VerwaltungsFehler,
  type Sitzung,
} from "../../src/lib/verwaltung.ts";

const VERBINDUNG = { url: "https://projekt.supabase.co", schluessel: "sb_publishable_test" };

const SITZUNG: Sitzung = {
  zugriff: "zugriffstoken",
  erneuerung: "erneuerungstoken",
  ablauf: Date.UTC(2026, 10, 22, 12, 0) / 1000,
  nutzerId: "nutzer-1",
  email: "admin@example.org",
};

const TOKENANTWORT = {
  access_token: "neu",
  refresh_token: "neu-erneuerung",
  expires_at: 1_800_000_000,
  user: { id: "nutzer-1", email: "admin@example.org" },
};

/** Ein fetch, das antwortet und sich jeden Aufruf merkt. */
function abrufMit(antwort: Response | (() => Response)) {
  return vi.fn(async () => (typeof antwort === "function" ? antwort() : antwort.clone()));
}

function aufruf(abruf: ReturnType<typeof abrufMit>, nummer = 0) {
  const [adresse, optionen] = abruf.mock.calls[nummer] as unknown as [string, RequestInit];
  return {
    adresse: new URL(adresse),
    methode: optionen.method ?? "GET",
    kopf: optionen.headers as Record<string, string>,
    rumpf: optionen.body ? JSON.parse(optionen.body as string) : undefined,
  };
}

describe("Anmeldung", () => {
  it("meldet mit E-Mail und Passwort an und merkt sich die Sitzung", async () => {
    const abruf = abrufMit(Response.json(TOKENANTWORT));

    const sitzung = await anmelden(VERBINDUNG, " admin@example.org ", "geheim", abruf);

    const { adresse, methode, kopf, rumpf } = aufruf(abruf);
    expect(adresse.pathname).toBe("/auth/v1/token");
    expect(adresse.searchParams.get("grant_type")).toBe("password");
    expect(methode).toBe("POST");
    expect(kopf.apikey).toBe("sb_publishable_test");
    expect(rumpf).toEqual({ email: "admin@example.org", password: "geheim" });
    expect(sitzung).toEqual({
      zugriff: "neu",
      erneuerung: "neu-erneuerung",
      ablauf: 1_800_000_000,
      nutzerId: "nutzer-1",
      email: "admin@example.org",
    });
  });

  it("meldet falsche Zugangsdaten als solche", async () => {
    const abruf = abrufMit(
      Response.json(
        { error: "invalid_grant", error_description: "Invalid login credentials" },
        { status: 400 },
      ),
    );

    const fehler = await anmelden(VERBINDUNG, "a@b.de", "falsch", abruf).catch((e) => e);

    expect(fehler).toBeInstanceOf(VerwaltungsFehler);
    expect(fehler.art).toBe("anmeldung");
  });

  /** Eine Minute Puffer: Sonst laeuft das Token zwischen Pruefen und Senden ab. */
  it("erkennt eine Sitzung, die gleich abläuft", () => {
    const ablauf = new Date(SITZUNG.ablauf * 1000);

    expect(laeuftAb(SITZUNG, new Date(ablauf.getTime() - 5 * 60_000))).toBe(false);
    expect(laeuftAb(SITZUNG, new Date(ablauf.getTime() - 30_000))).toBe(true);
  });

  it("erneuert eine Sitzung mit dem Erneuerungstoken", async () => {
    const abruf = abrufMit(Response.json(TOKENANTWORT));

    const neu = await erneuern(VERBINDUNG, SITZUNG, abruf);

    const { adresse, rumpf } = aufruf(abruf);
    expect(adresse.searchParams.get("grant_type")).toBe("refresh_token");
    expect(rumpf).toEqual({ refresh_token: "erneuerungstoken" });
    expect(neu.zugriff).toBe("neu");
  });
});

describe("Berechtigung", () => {
  it("fragt die Datenbank, ob das Konto Admin ist", async () => {
    const abruf = abrufMit(Response.json(true));

    expect(await istAdmin(VERBINDUNG, SITZUNG, abruf)).toBe(true);

    const { adresse, methode, kopf } = aufruf(abruf);
    expect(adresse.pathname).toBe("/rest/v1/rpc/ist_ankuendigungen_admin");
    expect(methode).toBe("POST");
    expect(kopf.Authorization).toBe("Bearer zugriffstoken");
    expect(kopf.apikey).toBe("sb_publishable_test");
  });

  it("meldet eine abgelaufene Sitzung", async () => {
    const abruf = abrufMit(Response.json({ message: "JWT expired" }, { status: 401 }));

    const fehler = await istAdmin(VERBINDUNG, SITZUNG, abruf).catch((e) => e);

    expect(fehler.art).toBe("abgelaufen");
  });
});

describe("Ankündigungen verwalten", () => {
  it("lädt alle Ankündigungen einschließlich der verborgenen", async () => {
    const abruf = abrufMit(
      Response.json([
        {
          id: "a1",
          titel: "Entwurf",
          text: "Noch nicht freigegeben",
          gewicht: "info",
          sichtbar: false,
          veroeffentlicht_am: "2026-11-20T09:00:00Z",
        },
      ]),
    );

    const liste = await ladeAlle(VERBINDUNG, SITZUNG, abruf);

    expect(liste).toEqual([
      {
        id: "a1",
        titel: "Entwurf",
        text: "Noch nicht freigegeben",
        gewicht: "info",
        sichtbar: false,
        veroeffentlichtAm: "2026-11-20T09:00:00Z",
      },
    ]);
    expect(aufruf(abruf).adresse.searchParams.get("select")).toContain("sichtbar");
  });

  it("legt eine neue Ankündigung an", async () => {
    const abruf = abrufMit(new Response(null, { status: 201 }));

    await speichere(
      VERBINDUNG,
      SITZUNG,
      { titel: "  Raumänderung ", text: "Saal 2\n", gewicht: "wichtig", sichtbar: true },
      null,
      abruf,
    );

    const { adresse, methode, rumpf } = aufruf(abruf);
    expect(methode).toBe("POST");
    expect(adresse.pathname).toBe("/rest/v1/ankuendigungen");
    expect(rumpf).toEqual({
      titel: "Raumänderung",
      text: "Saal 2",
      gewicht: "wichtig",
      sichtbar: true,
    });
  });

  it("ändert eine bestehende Ankündigung nur über ihre Kennung", async () => {
    const abruf = abrufMit(new Response(null, { status: 204 }));

    await speichere(
      VERBINDUNG,
      SITZUNG,
      { titel: "Neu", text: "Text", gewicht: "info", sichtbar: false },
      "a1",
      abruf,
    );

    const { adresse, methode } = aufruf(abruf);
    expect(methode).toBe("PATCH");
    expect(adresse.searchParams.get("id")).toBe("eq.a1");
  });

  it("schaltet die Sichtbarkeit um", async () => {
    const abruf = abrufMit(new Response(null, { status: 204 }));

    await setzeSichtbar(VERBINDUNG, SITZUNG, "a1", true, abruf);

    const { methode, rumpf, adresse } = aufruf(abruf);
    expect(methode).toBe("PATCH");
    expect(adresse.searchParams.get("id")).toBe("eq.a1");
    expect(rumpf).toEqual({ sichtbar: true });
  });

  it("löscht über die Kennung", async () => {
    const abruf = abrufMit(new Response(null, { status: 204 }));

    await loesche(VERBINDUNG, SITZUNG, "a1", abruf);

    const { methode, adresse } = aufruf(abruf);
    expect(methode).toBe("DELETE");
    expect(adresse.searchParams.get("id")).toBe("eq.a1");
  });

  /** Row Level Security lehnt ab - das Konto ist (nicht mehr) Admin. */
  it("meldet fehlende Berechtigung", async () => {
    const abruf = abrufMit(
      Response.json(
        { code: "42501", message: "new row violates row-level security policy" },
        { status: 403 },
      ),
    );

    const fehler = await loesche(VERBINDUNG, SITZUNG, "a1", abruf).catch((e) => e);

    expect(fehler.art).toBe("berechtigung");
  });
});

describe("Eingabeprüfung", () => {
  const gueltig = {
    titel: "Raumänderung",
    text: "Saal 2",
    gewicht: "info" as const,
    sichtbar: false,
  };

  it("lässt einen vollständigen Entwurf durch", () => {
    expect(pruefeEntwurf(gueltig)).toEqual({});
  });

  it("verlangt Titel und Text", () => {
    expect(pruefeEntwurf({ ...gueltig, titel: "  ", text: "" })).toEqual({
      titel: "Bitte einen Titel eingeben.",
      text: "Bitte einen Text eingeben.",
    });
  });

  /** Dieselben Grenzen wie in der Datenbank - sonst kommt der Fehler erst von dort. */
  it("begrenzt die Länge wie die Datenbank", () => {
    const fehler = pruefeEntwurf({ ...gueltig, titel: "x".repeat(201), text: "y".repeat(5001) });

    expect(fehler.titel).toMatch(/200 Zeichen/);
    expect(fehler.text).toMatch(/5000 Zeichen/);
  });
});
