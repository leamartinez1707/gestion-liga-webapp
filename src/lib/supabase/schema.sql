-- =============================================================================
-- Schema: Gestión Ligas — Admin Panel
-- Description: Core tables for tournament, team, player, match, sanction, and
--              news management. Designed to extend Supabase auth.users via the
--              profiles table.
--
-- Roles, RLS policies, helper functions and triggers live in
-- supabase/migrations/ (apply them after this file on a fresh project).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- -----------------------------------------------------------------------------
-- role: superadmin / editor = staff (panel /admin); delegate = gestiona su equipo (team_id)
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  role text not null default 'delegate' check (role in ('superadmin', 'editor', 'delegate')),
  team_id uuid,              -- FK a teams agregada más abajo (teams se crea después)
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Tournaments
-- -----------------------------------------------------------------------------
-- -----------------------------------------------------------------------------
-- Series (e.g., Serie 1, Serie 2, +30, F8)
-- A league can have multiple series, each with its own divisions.
-- -----------------------------------------------------------------------------
create table series (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Divisions (e.g., Div A, Div B, Div C within a series)
-- -----------------------------------------------------------------------------
create table divisions (
  id uuid default gen_random_uuid() primary key,
  series_id uuid references series on delete cascade,
  name text not null,
  display_order integer default 0,
  created_at timestamptz default now()
);
create index idx_divisions_series on divisions(series_id);

-- -----------------------------------------------------------------------------
-- Tournaments (belongs to a division within a series)
-- -----------------------------------------------------------------------------
create table tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,             -- display name (e.g., "Primera División")
  series_id uuid references series,
  division_id uuid references divisions,
  season text not null,
  format text not null check (format in ('league', 'elimination', 'groups')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);
create index idx_tournaments_series on tournaments(series_id);
create index idx_tournaments_division on tournaments(division_id);

-- -----------------------------------------------------------------------------
-- Teams (clubs). Series/division/tournament come from registrations; the
-- series_id, division_id and tournament_id columns are legacy and unused.
-- -----------------------------------------------------------------------------
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  short_name text not null,
  shield_url text,
  category text,             -- display category (e.g., "Primera División")
  series_id uuid references series,
  division_id uuid references divisions,
  coach text,
  assistant_coach text,
  tournament_id uuid references tournaments on delete cascade,
  created_at timestamptz default now()
);
create index idx_teams_series on teams(series_id);
create index idx_teams_division on teams(division_id);

-- -----------------------------------------------------------------------------
-- Players
-- -----------------------------------------------------------------------------
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  number integer,
  position text check (position in ('arquero', 'defensa', 'mediocampista', 'delantero')),
  photo_url text,
  team_id uuid references teams on delete cascade,
  active boolean default true,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Matches
-- -----------------------------------------------------------------------------
create table matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments on delete cascade,
  home_team_id uuid references teams,
  away_team_id uuid references teams,
  matchday integer,
  date date,
  time time,
  home_score integer,
  away_score integer,
  status text default 'scheduled' check (status in ('scheduled', 'ongoing', 'finished')),
  venue text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Sanctions
-- -----------------------------------------------------------------------------
create table sanctions (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players,
  match_id uuid references matches,
  card_type text check (card_type in ('yellow', 'red')),
  match_date date,
  matches_suspended integer default 0,
  expires_after_match integer,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- News Articles
-- -----------------------------------------------------------------------------
create table news_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  excerpt text,
  content text,
  image_url text,
  pdf_url text,
  author text,
  category text,
  series_id uuid references series,
  published boolean default false,
  date date default current_date,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Registrations (inscripción de un equipo en un torneo) y lista de buena fe.
-- Reglas (triggers en supabase/migrations/20261007120000_registrations.sql):
--   - un equipo no puede estar en dos divisiones de la misma serie en una temporada
--   - un jugador de la lista tiene que ser del equipo; uno por torneo
-- -----------------------------------------------------------------------------
create table registrations (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid not null references tournaments on delete cascade,
  team_id uuid not null references teams on delete cascade,
  created_at timestamptz default now(),
  unique (tournament_id, team_id)
);

create table registration_players (
  registration_id uuid not null references registrations on delete cascade,
  player_id uuid not null references players on delete cascade,
  tournament_id uuid not null references tournaments on delete cascade,
  created_at timestamptz default now(),
  primary key (registration_id, player_id),
  unique (tournament_id, player_id)
);

-- -----------------------------------------------------------------------------
-- Goals (goleadores por partido)
-- -----------------------------------------------------------------------------
create table goals (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches on delete cascade,
  player_id uuid references players on delete cascade,
  goals integer not null default 1,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Sponsors
-- -----------------------------------------------------------------------------
create table sponsors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo_url text not null,
  link_url text,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table profiles
  add constraint profiles_team_id_fkey
  foreign key (team_id) references teams(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index idx_teams_tournament on teams(tournament_id);
create index idx_players_team on players(team_id);
create index idx_matches_tournament on matches(tournament_id);
create index idx_matches_date on matches(date);
create index idx_sanctions_player on sanctions(player_id);
create index idx_sanctions_match on sanctions(match_id);
create index idx_news_published on news_articles(published);
create index idx_news_series on news_articles(series_id);
create index idx_profiles_team on profiles(team_id);
