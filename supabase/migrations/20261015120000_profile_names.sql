-- Display name for accounts (referees are shown on the public match page)
alter table public.profiles add column if not exists display_name text;

-- Public: only the referee's name of a match, never the email or other profile data
create or replace function public.match_referee_name(p_match_id uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select nullif(trim(p.display_name), '')
  from public.matches m
  join public.profiles p on p.id = m.referee_id
  where m.id = p_match_id and p.role = 'referee';
$$;

revoke execute on function public.match_referee_name(uuid) from public;
grant execute on function public.match_referee_name(uuid) to anon, authenticated;
