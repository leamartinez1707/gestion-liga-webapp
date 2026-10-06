-- Top scorers aggregated in the database. Reading the whole goals table through
-- PostgREST is capped at 1000 rows, which silently truncated the ranking.
-- Null filters mean "no filter"; an empty array matches nothing. Teams are the
-- player's current team (same as the public pages).
create or replace function public.top_scorers(
  p_limit integer default 20,
  p_tournament_ids uuid[] default null,
  p_team_ids uuid[] default null
)
returns table (
  player_id uuid,
  player_name text,
  player_photo text,
  team_id uuid,
  team_name text,
  team_short_name text,
  team_shield text,
  goals bigint
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.name, p.photo_url, p.team_id, t.name, t.short_name, t.shield_url, sum(g.goals) as goals
  from public.goals g
  join public.players p on p.id = g.player_id
  left join public.teams t on t.id = p.team_id
  left join public.matches m on m.id = g.match_id
  where p.team_id is not null
    and (p_team_ids is null or p.team_id = any (p_team_ids))
    and (p_tournament_ids is null or m.tournament_id = any (p_tournament_ids))
  group by p.id, t.id
  having sum(g.goals) > 0
  order by goals desc, p.name asc
  limit greatest(coalesce(p_limit, 20), 0);
$$;

revoke execute on function public.top_scorers(integer, uuid[], uuid[]) from public;
grant execute on function public.top_scorers(integer, uuid[], uuid[]) to anon, authenticated;
