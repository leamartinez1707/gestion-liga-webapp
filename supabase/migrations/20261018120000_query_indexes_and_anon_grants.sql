-- Indexes for the filters the app now runs in the database instead of in JS
-- Team page, delegate panel and head-to-head: matches of a team, home or away
create index if not exists idx_matches_home_team on public.matches(home_team_id);
create index if not exists idx_matches_away_team on public.matches(away_team_id);
-- Foreign keys without an index (Supabase advisor): joins and cascading deletes
create index if not exists idx_match_events_player on public.match_events(player_id);
create index if not exists idx_match_events_team on public.match_events(team_id);
create index if not exists idx_match_lineups_team on public.match_lineups(team_id);
create index if not exists idx_tournaments_champion on public.tournaments(champion_team_id);
-- News listings: published ones, newest first
create index if not exists idx_news_published_date on public.news_articles(date desc) where published;

-- Defense in depth: visitors (anon) only read. RLS already blocks their writes,
-- but without the grant a missing or wrong policy can't open a table to them.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
