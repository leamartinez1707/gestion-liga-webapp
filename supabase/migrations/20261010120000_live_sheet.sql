-- =============================================================================
-- Planilla en vivo (árbitros) + configuración de la liga (amarillas)
--
-- - league_settings: una sola fila, editable por el staff.
-- - Rol 'referee': el admin lo da de alta por email y lo asigna a partidos.
-- - match_events: lo que carga el árbitro (gol, gol en contra, amarilla,
--   roja). recompute_match() deriva marcador, goleadores, tarjetas y
--   suspensiones por acumulación, todo en una transacción.
-- - sanctions.source distingue lo cargado a mano ('manual') de lo que sale de
--   la planilla o del formulario del partido ('match') y de la acumulación.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configuración de la liga
-- -----------------------------------------------------------------------------
create table if not exists public.league_settings (
  id boolean primary key default true check (id),
  -- 0 = las amarillas no suspenden
  yellow_cards_for_suspension integer not null default 5 check (yellow_cards_for_suspension >= 0),
  yellow_suspension_matches integer not null default 1 check (yellow_suspension_matches >= 0),
  red_card_matches integer not null default 1 check (red_card_matches >= 0),
  updated_at timestamptz default now()
);
insert into public.league_settings (id) values (true) on conflict do nothing;

alter table public.league_settings enable row level security;
create policy lectura_publica on public.league_settings for select using (true);
create policy staff_write on public.league_settings for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- -----------------------------------------------------------------------------
-- Árbitros
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('superadmin', 'editor', 'delegate', 'referee'));

alter table public.matches add column if not exists referee_id uuid references public.profiles(id) on delete set null;
-- Tiempo del partido en vivo: 1T, ET (entretiempo), 2T
alter table public.matches add column if not exists live_period text check (live_period in ('1T', 'ET', '2T'));
create index if not exists idx_matches_referee on public.matches(referee_id);

-- Staff, or the referee assigned to the match.
create or replace function public.can_edit_match(p_match_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_staff() or exists (
    select 1 from public.matches m
    join public.profiles p on p.id = m.referee_id
    where m.id = p_match_id and p.id = auth.uid() and p.role = 'referee'
  );
$$;

-- Staff only: turns an existing non-staff user into a referee (or back).
create or replace function public.set_referee(p_email text, p_is_referee boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_staff() then raise exception 'No autorizado.'; end if;
  select * into v_profile from public.profiles where lower(email) = lower(trim(p_email));
  if not found then
    raise exception 'No se encontró un usuario con ese email. Primero tiene que tener una cuenta.';
  end if;
  if v_profile.role in ('superadmin', 'editor') then
    raise exception 'Ese usuario es administrador.';
  end if;
  update public.profiles
  set role = case when p_is_referee then 'referee' else 'delegate' end,
      team_id = case when p_is_referee then null else team_id end
  where id = v_profile.id;
end;
$$;

-- Referees can read their own profile (already) and staff see all; the match
-- form needs the list of referees: staff only (profiles_select policy).

-- -----------------------------------------------------------------------------
-- Sanciones: origen y acumulación
-- -----------------------------------------------------------------------------
alter table public.sanctions drop constraint if exists sanctions_card_type_check;
alter table public.sanctions add constraint sanctions_card_type_check
  check (card_type in ('yellow', 'red', 'accumulation'));
alter table public.sanctions add column if not exists source text not null default 'manual'
  check (source in ('manual', 'match', 'accumulation'));

-- Internal: rebuilds a player's accumulation suspensions in one tournament.
create or replace function public._recompute_accumulation(p_player_id uuid, p_tournament_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_settings public.league_settings%rowtype;
  v_count integer := 0;
  r record;
begin
  select * into v_settings from public.league_settings limit 1;

  delete from public.sanctions sa
  using public.matches m
  where sa.match_id = m.id and m.tournament_id = p_tournament_id
    and sa.player_id = p_player_id and sa.card_type = 'accumulation';

  if coalesce(v_settings.yellow_cards_for_suspension, 0) <= 0 then return; end if;

  for r in
    select sa.match_id, m.matchday, m.date
    from public.sanctions sa
    join public.matches m on m.id = sa.match_id
    where sa.player_id = p_player_id and m.tournament_id = p_tournament_id and sa.card_type = 'yellow'
    order by m.matchday, sa.created_at
  loop
    v_count := v_count + 1;
    if v_count % v_settings.yellow_cards_for_suspension = 0 then
      insert into public.sanctions
        (player_id, match_id, card_type, match_date, matches_suspended, expires_after_match, source)
      values
        (p_player_id, r.match_id, 'accumulation', r.date, v_settings.yellow_suspension_matches,
         r.matchday + v_settings.yellow_suspension_matches, 'accumulation');
    end if;
  end loop;
end;
$$;

-- Staff: recompute after editing yellow cards by hand (Sanciones page).
create or replace function public.recompute_accumulation(p_player_id uuid, p_tournament_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_staff() then raise exception 'No autorizado.'; end if;
  perform public._recompute_accumulation(p_player_id, p_tournament_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Planilla: eventos del partido
-- -----------------------------------------------------------------------------
create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  type text not null check (type in ('goal', 'own_goal', 'yellow', 'red')),
  period text check (period in ('1T', '2T')),
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists idx_match_events_match on public.match_events(match_id);

alter table public.match_events enable row level security;
create policy lectura_publica on public.match_events for select using (true);
create policy editor_insert on public.match_events for insert to authenticated
  with check ((select public.can_edit_match(match_id)));
create policy editor_delete on public.match_events for delete to authenticated
  using ((select public.can_edit_match(match_id)));

-- Derives everything from the sheet: score, scorers, the match's cards and
-- the accumulation suspensions of the players involved.
create or replace function public.recompute_match(p_match_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_match public.matches%rowtype;
  v_settings public.league_settings%rowtype;
  v_affected uuid[];
  v_player uuid;
begin
  if not public.can_edit_match(p_match_id) then raise exception 'No autorizado.'; end if;
  select * into v_match from public.matches where id = p_match_id;
  if not found then raise exception 'Partido no encontrado.'; end if;
  select * into v_settings from public.league_settings limit 1;

  -- Score (an own goal counts for the other team)
  update public.matches set
    home_score = (select count(*) from public.match_events e where e.match_id = p_match_id and (
      (e.type = 'goal' and e.team_id = v_match.home_team_id) or (e.type = 'own_goal' and e.team_id = v_match.away_team_id))),
    away_score = (select count(*) from public.match_events e where e.match_id = p_match_id and (
      (e.type = 'goal' and e.team_id = v_match.away_team_id) or (e.type = 'own_goal' and e.team_id = v_match.home_team_id))),
    walkover = false
  where id = p_match_id;

  -- Scorers
  delete from public.goals where match_id = p_match_id;
  insert into public.goals (match_id, player_id, goals)
  select p_match_id, e.player_id, count(*)
  from public.match_events e
  where e.match_id = p_match_id and e.type = 'goal' and e.player_id is not null
  group by e.player_id;

  -- Cards of this match (players whose yellows change need their accumulation redone)
  v_affected := array(
    select player_id from public.sanctions
    where match_id = p_match_id and card_type = 'yellow' and player_id is not null);

  delete from public.sanctions where match_id = p_match_id and source = 'match';
  insert into public.sanctions (player_id, match_id, card_type, match_date, matches_suspended, expires_after_match, source)
  select e.player_id, p_match_id, e.type, v_match.date,
    case when e.type = 'red' then v_settings.red_card_matches else 0 end,
    case when e.type = 'red' then v_match.matchday + v_settings.red_card_matches else null end,
    'match'
  from public.match_events e
  where e.match_id = p_match_id and e.type in ('yellow', 'red') and e.player_id is not null;

  v_affected := v_affected || array(
    select player_id from public.sanctions
    where match_id = p_match_id and card_type = 'yellow' and player_id is not null);

  for v_player in select distinct unnest(v_affected) loop
    perform public._recompute_accumulation(v_player, v_match.tournament_id);
  end loop;
end;
$$;

-- Referee/staff: start, half-time, second half, finish.
create or replace function public.set_match_live_state(p_match_id uuid, p_status text, p_period text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.can_edit_match(p_match_id) then raise exception 'No autorizado.'; end if;
  if p_status not in ('scheduled', 'ongoing', 'finished') then raise exception 'Estado inválido.'; end if;
  update public.matches set
    status = p_status,
    live_period = case when p_status = 'ongoing' then p_period else null end,
    -- A finished match without any goal is 0-0, not "no result"
    home_score = case when p_status = 'finished' then coalesce(home_score, 0) else home_score end,
    away_score = case when p_status = 'finished' then coalesce(away_score, 0) else away_score end
  where id = p_match_id;
end;
$$;

revoke execute on function public._recompute_accumulation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.can_edit_match(uuid) from public, anon;
revoke execute on function public.set_referee(text, boolean) from public, anon;
revoke execute on function public.recompute_accumulation(uuid, uuid) from public, anon;
revoke execute on function public.recompute_match(uuid) from public, anon;
revoke execute on function public.set_match_live_state(uuid, text, text) from public, anon;
grant execute on function public.can_edit_match(uuid) to authenticated;
grant execute on function public.set_referee(text, boolean) to authenticated;
grant execute on function public.recompute_accumulation(uuid, uuid) to authenticated;
grant execute on function public.recompute_match(uuid) to authenticated;
grant execute on function public.set_match_live_state(uuid, text, text) to authenticated;
