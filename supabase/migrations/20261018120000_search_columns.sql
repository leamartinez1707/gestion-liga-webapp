-- Accent-insensitive search in the panel: "baran" finds "Barán".
create extension if not exists unaccent with schema extensions;

-- unaccent() isn't immutable, so it can't feed a generated column directly
create or replace function public.search_text(value text)
returns text language sql immutable parallel safe set search_path = ''
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''))) $$;

alter table public.players add column if not exists search_name text
  generated always as (public.search_text(name)) stored;
alter table public.teams add column if not exists search_name text
  generated always as (public.search_text(name || ' ' || coalesce(short_name, ''))) stored;
