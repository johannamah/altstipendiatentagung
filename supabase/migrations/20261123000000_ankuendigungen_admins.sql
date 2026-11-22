-- Admins fuer Ankuendigungen (ADR-0014).
--
-- Zwei Personen sollen Ankuendigungen veroeffentlichen duerfen - und nichts
-- sonst. Sie melden sich in der App an (Supabase Auth, E-Mail und Passwort)
-- und bekommen keinen Zugang zum Supabase-Dashboard.
--
-- Wer Admin ist, steht in ankuendigungen_admins. Eintragen koennen das nur die
-- Entwickler im SQL Editor; ueber die Schnittstelle kann niemand sich selbst
-- oder andere ernennen.

create table public.ankuendigungen_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  angelegt_am timestamptz not null default now()
);

comment on table public.ankuendigungen_admins is
  'Konten, die Ankuendigungen anlegen, aendern und loeschen duerfen. Pflege nur im SQL Editor.';

alter table public.ankuendigungen_admins enable row level security;

revoke all on table public.ankuendigungen_admins from anon, authenticated;

-- Die Pruefung laeuft mit den Rechten des Eigentuemers, damit die Richtlinien
-- unten die Tabelle lesen koennen, ohne sie angemeldeten Konten zu oeffnen.
create function public.ist_ankuendigungen_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ankuendigungen_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.ist_ankuendigungen_admin() from public, anon, authenticated;
grant execute on function public.ist_ankuendigungen_admin() to authenticated;

-- Schreibrechte bekommen angemeldete Konten nur auf die Ankuendigungen, und
-- RLS laesst davon nur Admins durch. Besucher (anon) bleiben beim Lesen.
grant insert, update, delete on table public.ankuendigungen to authenticated;

create policy "Admins lesen alle Ankuendigungen"
  on public.ankuendigungen
  for select
  to authenticated
  using ((select public.ist_ankuendigungen_admin()));

create policy "Admins legen Ankuendigungen an"
  on public.ankuendigungen
  for insert
  to authenticated
  with check ((select public.ist_ankuendigungen_admin()));

create policy "Admins aendern Ankuendigungen"
  on public.ankuendigungen
  for update
  to authenticated
  using ((select public.ist_ankuendigungen_admin()))
  with check ((select public.ist_ankuendigungen_admin()));

create policy "Admins loeschen Ankuendigungen"
  on public.ankuendigungen
  for delete
  to authenticated
  using ((select public.ist_ankuendigungen_admin()));
