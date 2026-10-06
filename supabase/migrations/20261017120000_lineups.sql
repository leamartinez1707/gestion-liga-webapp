-- =============================================================================
-- Planilla de jugadores: quién jugó cada partido.
-- - match_lineups: lo marca el árbitro asignado o el staff (como match_events).
--   is_guest = refuerzo: jugador que no está en la lista de buena fe del torneo.
-- - league_settings: si la liga permite refuerzos y cuántos partidos por torneo
--   puede jugar cada uno (0 = sin límite).
-- =============================================================================
alter table public.league_settings
  add column if not exists guest_players_allowed boolean not null default false,
  add column if not exists guest_player_max_matches integer not null default 1 check (guest_player_max_matches >= 0);

create table if not exists public.match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  is_guest boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  unique (match_id, player_id)
);
create index if not exists idx_match_lineups_player on public.match_lineups(player_id);

alter table public.match_lineups enable row level security;
create policy lectura_publica on public.match_lineups for select using (true);
create policy editor_insert on public.match_lineups for insert to authenticated
  with check ((select public.can_edit_match(match_id)));
create policy editor_delete on public.match_lineups for delete to authenticated
  using ((select public.can_edit_match(match_id)));
