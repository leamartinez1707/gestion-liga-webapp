-- =============================================================================
-- Inscripciones y lista de buena fe
--
-- Un equipo (club) se inscribe en torneos; cada torneo pertenece a una serie,
-- división y temporada. El mismo club puede jugar en varias series (p. ej. F8 y
-- F11), pero no en dos divisiones de la misma serie en la misma temporada.
--
-- La lista de buena fe son los jugadores del club habilitados para un torneo.
-- Un jugador no puede figurar en dos equipos del mismo torneo.
--
-- teams.series_id / teams.division_id / teams.tournament_id quedan obsoletos:
-- la serie y división de un equipo salen de sus inscripciones.
-- =============================================================================

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  unique (tournament_id, team_id)
);
create index if not exists idx_registrations_team on public.registrations(team_id);

create table if not exists public.registration_players (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  -- copied from the registration so "one team per tournament" can be a unique constraint
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (registration_id, player_id),
  unique (tournament_id, player_id)
);
create index if not exists idx_registration_players_player on public.registration_players(player_id);

-- -----------------------------------------------------------------------------
-- Reglas
-- -----------------------------------------------------------------------------
create or replace function public.check_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tournament public.tournaments%rowtype;
  v_other text;
begin
  select * into v_tournament from public.tournaments where id = new.tournament_id;

  select d.name into v_other
  from public.registrations r
  join public.tournaments t on t.id = r.tournament_id
  left join public.divisions d on d.id = t.division_id
  where r.team_id = new.team_id
    and r.id <> new.id
    and t.series_id = v_tournament.series_id
    and t.season = v_tournament.season
    and t.division_id is distinct from v_tournament.division_id
  limit 1;

  if found then
    raise exception 'El equipo ya está inscripto en %, otra división de esta serie, para la temporada %.',
      coalesce(v_other, 'otra división'), v_tournament.season;
  end if;
  return new;
end;
$$;

drop trigger if exists check_registration on public.registrations;
create trigger check_registration
  before insert or update on public.registrations
  for each row execute function public.check_registration();

create or replace function public.check_registration_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
begin
  select * into v_registration from public.registrations where id = new.registration_id;
  new.tournament_id := v_registration.tournament_id;

  if not exists (
    select 1 from public.players where id = new.player_id and team_id = v_registration.team_id
  ) then
    raise exception 'El jugador no pertenece a este equipo.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_registration_player on public.registration_players;
create trigger check_registration_player
  before insert or update on public.registration_players
  for each row execute function public.check_registration_player();

revoke execute on function public.check_registration() from public, anon, authenticated;
revoke execute on function public.check_registration_player() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS: lectura pública; inscripciones solo staff; lista de buena fe staff o el
-- delegado del equipo inscripto.
-- -----------------------------------------------------------------------------
alter table public.registrations enable row level security;
alter table public.registration_players enable row level security;

create policy lectura_publica on public.registrations for select using (true);
create policy staff_write on public.registrations for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy lectura_publica on public.registration_players for select using (true);
create policy roster_write on public.registration_players for all to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.team_id = (select public.my_team_id())
    )
  )
  with check (
    (select public.is_staff())
    or exists (
      select 1 from public.registrations r
      where r.id = registration_id and r.team_id = (select public.my_team_id())
    )
  );

-- -----------------------------------------------------------------------------
-- Datos existentes: teams.tournament_id → inscripción; lista de buena fe con
-- todos los jugadores activos del equipo.
-- -----------------------------------------------------------------------------
insert into public.registrations (tournament_id, team_id)
select tournament_id, id from public.teams where tournament_id is not null
on conflict (tournament_id, team_id) do nothing;

insert into public.registration_players (registration_id, player_id, tournament_id)
select r.id, p.id, r.tournament_id
from public.registrations r
join public.players p on p.team_id = r.team_id and p.active
on conflict do nothing;
