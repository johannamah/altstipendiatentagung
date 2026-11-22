-- Ankuendigungen der Tagung (ADR-0014).
--
-- Die Datenbank ist aus dem Internet erreichbar, und der veroeffentlichbare
-- Schluessel steht in jedem Browser. Geschuetzt wird deshalb hier:
--   * Lesen duerfen alle, aber nur Zeilen mit sichtbar = true.
--   * Schreiben darf ueber die Schnittstelle niemand. Ankuendigungen entstehen
--     im Supabase-Dashboard (Table Editor), das mit Administratorrechten arbeitet.

create table public.ankuendigungen (
  id uuid primary key default gen_random_uuid(),
  titel text not null check (char_length(btrim(titel)) between 1 and 200),
  text text not null check (char_length(btrim(text)) between 1 and 5000),
  -- "wichtig" hebt hervor; sparsam einsetzen, sonst nutzt es sich ab.
  gewicht text not null default 'info' check (gewicht in ('info', 'wichtig')),
  -- Erst sichtbar, wenn jemand es bewusst einschaltet: Ein halb geschriebener
  -- Eintrag soll nicht schon beim Speichern auf allen Geraeten erscheinen.
  sichtbar boolean not null default false,
  veroeffentlicht_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

comment on table public.ankuendigungen is
  'Kurzfristige Neuigkeiten der Jahrestagung. Oeffentlich lesbar, wenn sichtbar = true.';

create index ankuendigungen_sichtbar_idx
  on public.ankuendigungen (veroeffentlicht_am desc)
  where sichtbar;

alter table public.ankuendigungen enable row level security;

-- Supabase vergibt in public standardmaessig alle Rechte an anon und
-- authenticated. Zuerst alles entziehen, dann gezielt nur Lesen erlauben.
revoke all on table public.ankuendigungen from anon, authenticated;
grant select on table public.ankuendigungen to anon, authenticated;

create policy "Sichtbare Ankuendigungen lesen"
  on public.ankuendigungen
  for select
  to anon, authenticated
  using (sichtbar);

create function public.ankuendigungen_geaendert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.geaendert_am := now();
  return new;
end;
$$;

create trigger ankuendigungen_geaendert
  before update on public.ankuendigungen
  for each row
  execute function public.ankuendigungen_geaendert();
