import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Die Migrationen gegen ein echtes Postgres (PGlite, im Prozess).
 *
 * Die Datenbank ist aus dem Internet erreichbar, der veroeffentlichbare
 * Schluessel steht in jedem Browser. Was Besucher, angemeldete Konten und
 * Admins duerfen, entscheidet allein Row Level Security - also wird genau das
 * hier ausprobiert, nicht der SQL-Text gelesen.
 *
 * Nachgebildet ist, was Supabase mitbringt: die Rollen anon und authenticated,
 * deren Standardrechte im Schema public und auth.uid() aus dem Token.
 */

const verzeichnis = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
const migrationen = readdirSync(verzeichnis)
  .filter((datei) => datei.endsWith(".sql"))
  .sort()
  .map((datei) => readFileSync(`${verzeichnis}/${datei}`, "utf8"));

const SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const KONTO = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;

/** Fuehrt eine Abfrage so aus, wie sie ueber die Schnittstelle ankaeme. */
async function als(wer: "anon" | "konto" | "admin", sql: string, parameter: unknown[] = []) {
  const rolle = wer === "anon" ? "anon" : "authenticated";
  const nutzer = wer === "admin" ? ADMIN : wer === "konto" ? KONTO : "";
  await db.exec(`reset role; set request.jwt.claim.sub = '${nutzer}'; set role ${rolle};`);
  try {
    return await db.query<Record<string, unknown>>(sql, parameter);
  } finally {
    await db.exec("reset role;");
  }
}

const titel = async (wer: "anon" | "konto" | "admin") =>
  (await als(wer, "select titel from public.ankuendigungen order by titel")).rows.map(
    (zeile) => zeile.titel,
  );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE);
  for (const sql of migrationen) await db.exec(sql);

  await db.exec(`
    insert into auth.users (id) values ('${ADMIN}'), ('${KONTO}');
    insert into public.ankuendigungen_admins (user_id) values ('${ADMIN}');
    insert into public.ankuendigungen (titel, text, sichtbar) values
      ('Sichtbar', 'Für alle', true),
      ('Entwurf', 'Noch nicht freigegeben', false);
  `);
}, 30_000);

describe("Besucher ohne Anmeldung", () => {
  it("sehen nur sichtbare Ankündigungen", async () => {
    expect(await titel("anon")).toEqual(["Sichtbar"]);
  });

  it("können nichts anlegen, ändern oder löschen", async () => {
    await expect(
      als("anon", "insert into public.ankuendigungen (titel, text) values ('x', 'y')"),
    ).rejects.toThrow(/permission denied/);
    await expect(als("anon", "update public.ankuendigungen set sichtbar = true")).rejects.toThrow(
      /permission denied/,
    );
    await expect(als("anon", "delete from public.ankuendigungen")).rejects.toThrow(
      /permission denied/,
    );
  });

  it("erfahren nicht, wer Admin ist", async () => {
    await expect(als("anon", "select * from public.ankuendigungen_admins")).rejects.toThrow(
      /permission denied/,
    );
  });
});

/** Ein angemeldetes Konto, das nicht in ankuendigungen_admins steht. */
describe("Angemeldete Konten ohne Admin-Recht", () => {
  it("sehen nur sichtbare Ankündigungen", async () => {
    expect(await titel("konto")).toEqual(["Sichtbar"]);
  });

  it("können keine Ankündigung anlegen", async () => {
    await expect(
      als("konto", "insert into public.ankuendigungen (titel, text) values ('x', 'y')"),
    ).rejects.toThrow(/row-level security/);
  });

  it("ändern und löschen nichts", async () => {
    await als("konto", "update public.ankuendigungen set titel = 'Gekapert'");
    await als("konto", "delete from public.ankuendigungen");

    expect(await titel("admin")).toEqual(["Entwurf", "Sichtbar"]);
  });

  it("können sich nicht selbst zum Admin machen", async () => {
    await expect(
      als("konto", `insert into public.ankuendigungen_admins (user_id) values ('${KONTO}')`),
    ).rejects.toThrow(/permission denied/);
  });

  it("sind laut Prüffunktion kein Admin", async () => {
    const { rows } = await als("konto", "select public.ist_ankuendigungen_admin() as admin");
    expect(rows[0]?.admin).toBe(false);
  });
});

describe("Admins", () => {
  it("sehen auch verborgene Ankündigungen", async () => {
    expect(await titel("admin")).toEqual(["Entwurf", "Sichtbar"]);
  });

  it("sind laut Prüffunktion Admin", async () => {
    const { rows } = await als("admin", "select public.ist_ankuendigungen_admin() as admin");
    expect(rows[0]?.admin).toBe(true);
  });

  it("legen an, schalten sichtbar und löschen", async () => {
    await als(
      "admin",
      "insert into public.ankuendigungen (titel, text, gewicht) values ('Raumänderung', 'Saal 2', 'wichtig')",
    );
    await als(
      "admin",
      "update public.ankuendigungen set sichtbar = true where titel = 'Raumänderung'",
    );
    expect(await titel("anon")).toContain("Raumänderung");

    await als("admin", "delete from public.ankuendigungen where titel = 'Raumänderung'");
    expect(await titel("admin")).toEqual(["Entwurf", "Sichtbar"]);
  });

  it("können keine weiteren Admins ernennen", async () => {
    await expect(
      als("admin", `insert into public.ankuendigungen_admins (user_id) values ('${KONTO}')`),
    ).rejects.toThrow(/permission denied/);
  });

  it("halten die Regeln der Tabelle ein", async () => {
    await expect(
      als("admin", "insert into public.ankuendigungen (titel, text) values ('   ', 'leer')"),
    ).rejects.toThrow(/check constraint/);
    await expect(
      als(
        "admin",
        "insert into public.ankuendigungen (titel, text, gewicht) values ('x', 'y', 'dringend')",
      ),
    ).rejects.toThrow(/check constraint/);
  });
});
