-- QA hardening: rules enforced in the DB, not only in the app.
-- Safe to run more than once (SQL Editor).

-- 1) How many days after the match the assigned referee can still edit a
--    finished match. NULL = no limit (default). Staff can always edit.
alter table public.league_settings
  add column if not exists referee_edit_days integer
  check (referee_edit_days is null or referee_edit_days >= 0);

create or replace function public.can_edit_match(p_match_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select public.is_staff() or exists (
    select 1 from public.matches m
    join public.profiles p on p.id = m.referee_id
    left join public.league_settings s on true
    where m.id = p_match_id and p.id = auth.uid() and p.role = 'referee'
      and (
        m.status <> 'finished'
        or s.referee_edit_days is null
        or m.date is null
        or m.date + s.referee_edit_days >= (now() at time zone 'America/Argentina/Buenos_Aires')::date
      )
  );
$$;

-- 2) Events and lineups only for the two teams of the match, and only with
--    players of that team (refuerzos are players of the club too).
create or replace function public.check_match_row_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assist uuid;
begin
  if not exists (
    select 1 from public.matches m
    where m.id = new.match_id and new.team_id in (m.home_team_id, m.away_team_id)
  ) then
    raise exception 'Ese equipo no juega este partido.';
  end if;
  if new.player_id is not null and not exists (
    select 1 from public.players p where p.id = new.player_id and p.team_id = new.team_id
  ) then
    raise exception 'El jugador no es de ese equipo.';
  end if;
  if tg_table_name = 'match_events' then
    v_assist := new.assist_player_id;
    if v_assist is not null and not exists (
      select 1 from public.players p where p.id = v_assist and p.team_id = new.team_id
    ) then
      raise exception 'El que asiste no es de ese equipo.';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_match_row_team() from public, anon, authenticated;

drop trigger if exists match_events_check_team on public.match_events;
create trigger match_events_check_team
  before insert on public.match_events
  for each row execute function public.check_match_row_team();

drop trigger if exists match_lineups_check_team on public.match_lineups;
create trigger match_lineups_check_team
  before insert on public.match_lineups
  for each row execute function public.check_match_row_team();

-- 3) recompute_match: lock the match so two saves at the same time can't
--    duplicate scorers or cards; only count events of the match's teams.
create or replace function public.recompute_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_match public.matches%rowtype; v_settings public.league_settings%rowtype;
  v_affected uuid[]; v_player uuid;
begin
  if not public.can_edit_match(p_match_id) then raise exception 'No autorizado.'; end if;
  select * into v_match from public.matches where id = p_match_id for update;
  if not found then raise exception 'Partido no encontrado.'; end if;
  select * into v_settings from public.league_settings limit 1;
  update public.matches set
    home_score = (select count(*) from public.match_events e where e.match_id = p_match_id and (
      (e.type = 'goal' and e.team_id = v_match.home_team_id) or (e.type = 'own_goal' and e.team_id = v_match.away_team_id))),
    away_score = (select count(*) from public.match_events e where e.match_id = p_match_id and (
      (e.type = 'goal' and e.team_id = v_match.away_team_id) or (e.type = 'own_goal' and e.team_id = v_match.home_team_id))),
    walkover = false
  where id = p_match_id;
  delete from public.goals where match_id = p_match_id;
  insert into public.goals (match_id, player_id, goals)
  select p_match_id, e.player_id, count(*) from public.match_events e
  where e.match_id = p_match_id and e.type = 'goal' and e.player_id is not null
    and e.team_id in (v_match.home_team_id, v_match.away_team_id)
  group by e.player_id;
  v_affected := array(select player_id from public.sanctions
    where match_id = p_match_id and card_type = 'yellow' and player_id is not null);
  delete from public.sanctions where match_id = p_match_id and source = 'match';
  insert into public.sanctions (player_id, match_id, card_type, match_date, matches_suspended, expires_after_match, source)
  select e.player_id, p_match_id, e.type, v_match.date,
    case when e.type = 'red' then v_settings.red_card_matches else 0 end,
    case when e.type = 'red' then v_match.matchday + v_settings.red_card_matches else null end, 'match'
  from public.match_events e
  where e.match_id = p_match_id and e.type in ('yellow', 'red') and e.player_id is not null
    and e.team_id in (v_match.home_team_id, v_match.away_team_id);
  v_affected := v_affected || array(select player_id from public.sanctions
    where match_id = p_match_id and card_type = 'yellow' and player_id is not null);
  for v_player in select distinct unnest(v_affected) loop
    perform public._recompute_accumulation(v_player, v_match.tournament_id);
  end loop;
end; $$;

-- 4) Delegates add and edit their players but can't delete them (that would
--    erase goals and lineups): they deactivate them. Deleting is staff only.
drop policy if exists players_write on public.players;
drop policy if exists players_insert on public.players;
drop policy if exists players_update on public.players;
drop policy if exists players_delete on public.players;
create policy players_insert on public.players for insert to authenticated
  with check ((select public.is_staff()) or team_id = (select public.my_team_id()));
create policy players_update on public.players for update to authenticated
  using ((select public.is_staff()) or team_id = (select public.my_team_id()))
  with check ((select public.is_staff()) or team_id = (select public.my_team_id()));
create policy players_delete on public.players for delete to authenticated
  using ((select public.is_staff()));

-- Lista de buena fe: delegates only while the team is still in the tournament
drop policy if exists roster_write on public.registration_players;
create policy roster_write on public.registration_players for all to authenticated
  using ((select public.is_staff()) or exists (
    select 1 from public.registrations r
    where r.id = registration_players.registration_id
      and r.team_id = (select public.my_team_id()) and r.withdrawn_at is null))
  with check ((select public.is_staff()) or exists (
    select 1 from public.registrations r
    where r.id = registration_players.registration_id
      and r.team_id = (select public.my_team_id()) and r.withdrawn_at is null));

-- 5) Storage: delegates upload only team shields and player photos. The bucket
--    is public (files are served by URL), so visitors don't need to list it;
--    signed-in staff/delegates keep SELECT because Storage needs it to remove files.
drop policy if exists imagenes_escritura on storage.objects;
create policy imagenes_escritura on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-images' and (
      (select public.is_staff())
      or ((select public.my_team_id()) is not null and (storage.foldername(name))[1] in ('teams', 'players'))
    )
  );
drop policy if exists lectura_publica_imagenes on storage.objects;
drop policy if exists lectura_imagenes on storage.objects;
create policy lectura_imagenes on storage.objects for select to authenticated
  using (bucket_id = 'public-images' and ((select public.is_staff()) or (select public.my_team_id()) is not null));

-- 6) Defense in depth: anon has no profile policy, drop the grant too; and
--    signed-in users don't need TRUNCATE/TRIGGER/REFERENCES.
revoke select on public.profiles from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
