-- Squad photo of each team per season (the public team page shows it by year)
create table if not exists public.team_season_photos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null,
  url text not null,
  created_at timestamptz default now(),
  unique (team_id, season)
);

alter table public.team_season_photos enable row level security;

create policy lectura_publica on public.team_season_photos for select using (true);
create policy staff_escritura on public.team_season_photos for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
