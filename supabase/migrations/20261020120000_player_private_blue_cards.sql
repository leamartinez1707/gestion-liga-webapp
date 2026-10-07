-- Cédula and phone of players: private (never on the public site). Staff and
-- the team's delegates manage them; referees read them to check IDs.
create table if not exists public.player_private (
  player_id uuid primary key references public.players(id) on delete cascade,
  document text check (document is null or length(document) <= 30),
  phone text check (phone is null or length(phone) <= 30),
  updated_at timestamptz not null default now()
);

alter table public.player_private enable row level security;
revoke all on public.player_private from anon;
grant select, insert, update, delete on public.player_private to authenticated;

drop policy if exists player_private_read on public.player_private;
create policy player_private_read on public.player_private for select to authenticated
  using (
    (select public.is_staff())
    or exists (select 1 from public.players p where p.id = player_id and p.team_id = (select public.my_team_id()))
    or exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'referee')
  );

drop policy if exists player_private_write on public.player_private;
create policy player_private_write on public.player_private for all to authenticated
  using (
    (select public.is_staff())
    or exists (select 1 from public.players p where p.id = player_id and p.team_id = (select public.my_team_id()))
  )
  with check (
    (select public.is_staff())
    or exists (select 1 from public.players p where p.id = player_id and p.team_id = (select public.my_team_id()))
  );

-- Blue card (futsal): the player leaves the match, no suspension afterwards.
-- Only offered on the sheet when the league enables it.
alter table public.league_settings
  add column if not exists blue_cards_enabled boolean not null default false;

alter table public.match_events drop constraint if exists match_events_type_check;
alter table public.match_events drop constraint if exists match_events_type_check_v2;
alter table public.match_events add constraint match_events_type_check_v2
  check (type in ('goal', 'own_goal', 'yellow', 'red', 'blue'));
