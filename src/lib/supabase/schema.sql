-- =============================================================================
-- Schema: Gestión Ligas — Admin Panel
-- Description: Core tables for tournament, team, player, match, sanction, and
--              news management. Designed to extend Supabase auth.users via the
--              profiles table.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- -----------------------------------------------------------------------------
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  role text not null check (role in ('superadmin', 'editor')),
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Tournaments
-- -----------------------------------------------------------------------------
create table tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  season text not null,
  format text not null check (format in ('league', 'elimination', 'groups')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Teams
-- -----------------------------------------------------------------------------
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  short_name text not null,
  shield_url text,
  category text not null,
  coach text,
  assistant_coach text,
  tournament_id uuid references tournaments on delete cascade,
  created_at timestamptz default now()
);

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
  published boolean default false,
  date date default current_date,
  created_at timestamptz default now()
);

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
