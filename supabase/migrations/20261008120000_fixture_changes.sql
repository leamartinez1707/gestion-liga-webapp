-- =============================================================================
-- Fixture modificable: partidos suspendidos/cancelados, W.O. y bajas de equipos
--
-- status:
--   scheduled  programado
--   ongoing    en juego
--   finished   finalizado (incluye W.O.)
--   postponed  suspendido, se reprograma más adelante (no cuenta en la tabla)
--   cancelled  cancelado, no se juega (no cuenta en la tabla)
--
-- W.O.: siempre 3-0 para el ganador (status finished, walkover = true).
-- Baja de un equipo: los partidos ya jugados quedan; los pendientes pasan a
-- W.O. 3-0 a favor del rival.
-- =============================================================================

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches
  add constraint matches_status_check
  check (status in ('scheduled', 'ongoing', 'finished', 'postponed', 'cancelled'));

alter table public.matches add column if not exists walkover boolean not null default false;
-- Motivo visible al público (p. ej. "Suspendido por lluvia")
alter table public.matches add column if not exists notes text;

alter table public.registrations add column if not exists withdrawn_at timestamptz;

create or replace function public.withdraw_team(p_registration_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations%rowtype;
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'No autorizado.';
  end if;

  select * into v_registration from public.registrations where id = p_registration_id;
  if not found then
    raise exception 'Inscripción no encontrada.';
  end if;
  if v_registration.withdrawn_at is not null then
    raise exception 'El equipo ya fue dado de baja de este torneo.';
  end if;

  update public.registrations set withdrawn_at = now() where id = p_registration_id;

  -- Pending matches → W.O. 3-0 for the opponent
  update public.matches m set
    status = 'finished',
    walkover = true,
    home_score = case when m.home_team_id = v_registration.team_id then 0 else 3 end,
    away_score = case when m.away_team_id = v_registration.team_id then 0 else 3 end,
    notes = 'W.O. por baja del equipo'
  where m.tournament_id = v_registration.tournament_id
    and v_registration.team_id in (m.home_team_id, m.away_team_id)
    and m.status in ('scheduled', 'ongoing', 'postponed');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.withdraw_team(uuid) from public, anon;
grant execute on function public.withdraw_team(uuid) to authenticated;
