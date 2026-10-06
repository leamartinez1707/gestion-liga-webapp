-- Assists: the referee can say who assisted each goal on the live sheet
alter table public.match_events
  add column if not exists assist_player_id uuid references public.players(id) on delete set null;

create index if not exists idx_match_events_assist on public.match_events(assist_player_id);
