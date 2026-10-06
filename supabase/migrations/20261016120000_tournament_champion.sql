-- The tournament's champion: the public team page counts its titles ("copas")
alter table public.tournaments
  add column if not exists champion_team_id uuid references public.teams(id) on delete set null;
