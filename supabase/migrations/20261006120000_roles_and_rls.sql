-- =============================================================================
-- Roles y RLS
--
-- Roles:
--   superadmin / editor  → "staff": gestionan toda la liga desde /admin.
--   delegate             → gestiona solo el plantel y datos básicos de su equipo
--                          (profiles.team_id) desde /delegado.
--
-- Antes de esta migración cualquier usuario autenticado podía escribir en casi
-- todas las tablas, y profiles tenía RLS sin policies (nadie podía leerla, lo
-- que rompía las policies de teams/players y el panel de delegado).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles: rol delegate + alta automática al crear un usuario
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('superadmin', 'editor', 'delegate'));
alter table public.profiles alter column role set default 'delegate';

create index if not exists idx_profiles_team on public.profiles(team_id);

-- Si se borra un equipo, su delegado queda sin equipo (en vez de bloquear el borrado)
alter table public.profiles drop constraint if exists profiles_team_id_fkey;
alter table public.profiles
  add constraint profiles_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'delegate')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para usuarios que ya existían. Para dar rol de administrador:
--   update public.profiles set role = 'superadmin' where email = '<email>';
insert into public.profiles (id, email, role)
select u.id, u.email, 'delegate'
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Helpers (security definer: leen profiles sin depender de sus policies)
-- -----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('superadmin', 'editor')
  );
$$;

create or replace function public.my_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.profiles
  where id = auth.uid() and role = 'delegate';
$$;

revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.my_team_id() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.my_team_id() to authenticated;

-- -----------------------------------------------------------------------------
-- Asignación de delegados (solo staff). Evita que un editor pueda tocar roles.
-- -----------------------------------------------------------------------------
create or replace function public.assign_delegate(p_team_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_staff() then
    raise exception 'No autorizado.';
  end if;

  select * into v_profile from public.profiles
  where lower(email) = lower(trim(p_email));

  if not found then
    raise exception 'No se encontró un usuario con ese email.';
  end if;
  if v_profile.role <> 'delegate' then
    raise exception 'Ese usuario es administrador y no puede ser delegado.';
  end if;

  -- Un delegado por equipo
  update public.profiles set team_id = null
  where team_id = p_team_id and id <> v_profile.id;

  update public.profiles set team_id = p_team_id where id = v_profile.id;
end;
$$;

create or replace function public.revoke_delegate(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'No autorizado.';
  end if;
  update public.profiles set team_id = null where team_id = p_team_id;
end;
$$;

revoke execute on function public.assign_delegate(uuid, text) from public, anon;
revoke execute on function public.revoke_delegate(uuid) from public, anon;
grant execute on function public.assign_delegate(uuid, text) to authenticated;
grant execute on function public.revoke_delegate(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Un delegado no puede mover su equipo de serie/división/torneo
-- -----------------------------------------------------------------------------
create or replace function public.guard_team_structure()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() nulo = service_role / SQL editor
  if auth.uid() is not null and not public.is_staff() then
    if new.series_id is distinct from old.series_id
      or new.division_id is distinct from old.division_id
      or new.tournament_id is distinct from old.tournament_id
      or new.category is distinct from old.category then
      raise exception 'Solo la administración puede cambiar la serie, división o torneo del equipo.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_team_structure on public.teams;
create trigger guard_team_structure
  before update on public.teams
  for each row execute function public.guard_team_structure();

-- -----------------------------------------------------------------------------
-- Policies: se reemplazan todas las de escritura
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'series', 'divisions', 'tournaments', 'matches', 'goals',
    'sanctions', 'news_articles', 'sponsors'
  ] loop
    execute format('drop policy if exists auth_insert on public.%I', t);
    execute format('drop policy if exists auth_update on public.%I', t);
    execute format('drop policy if exists auth_delete on public.%I', t);
    execute format('drop policy if exists staff_write on public.%I', t);
    execute format(
      'create policy staff_write on public.%I for all to authenticated
         using ((select public.is_staff())) with check ((select public.is_staff()))',
      t
    );
  end loop;
end;
$$;

-- Noticias: el público solo ve las publicadas
drop policy if exists lectura_publica on public.news_articles;
drop policy if exists lectura_publicadas on public.news_articles;
create policy lectura_publicadas on public.news_articles
  for select using (published = true or (select public.is_staff()));

-- Profiles: cada uno ve el suyo; el staff ve todos. Las escrituras van por RPC.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

-- Teams
drop policy if exists admin_insert_teams on public.teams;
drop policy if exists admin_delete_teams on public.teams;
drop policy if exists admin_delegate_update_teams on public.teams;
drop policy if exists teams_staff_insert on public.teams;
drop policy if exists teams_staff_delete on public.teams;
drop policy if exists teams_update on public.teams;
create policy teams_staff_insert on public.teams
  for insert to authenticated with check ((select public.is_staff()));
create policy teams_staff_delete on public.teams
  for delete to authenticated using ((select public.is_staff()));
create policy teams_update on public.teams
  for update to authenticated
  using ((select public.is_staff()) or id = (select public.my_team_id()))
  with check ((select public.is_staff()) or id = (select public.my_team_id()));

-- Players: staff, o el delegado sobre su propio equipo (no puede mover jugadores a otro)
drop policy if exists admin_delegate_insert_players on public.players;
drop policy if exists admin_delegate_update_players on public.players;
drop policy if exists admin_delegate_delete_players on public.players;
drop policy if exists players_write on public.players;
create policy players_write on public.players
  for all to authenticated
  using ((select public.is_staff()) or team_id = (select public.my_team_id()))
  with check ((select public.is_staff()) or team_id = (select public.my_team_id()));

-- Storage: solo staff y delegados con equipo pueden subir imágenes
drop policy if exists escritura_autenticados on storage.objects;
drop policy if exists actualizar_autenticados on storage.objects;
drop policy if exists borrar_autenticados on storage.objects;
drop policy if exists imagenes_escritura on storage.objects;
drop policy if exists imagenes_actualizar on storage.objects;
drop policy if exists imagenes_borrar on storage.objects;
create policy imagenes_escritura on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-images'
    and ((select public.is_staff()) or (select public.my_team_id()) is not null)
  );
create policy imagenes_actualizar on storage.objects
  for update to authenticated
  using (bucket_id = 'public-images' and (select public.is_staff()));
create policy imagenes_borrar on storage.objects
  for delete to authenticated
  using (bucket_id = 'public-images' and (select public.is_staff()));
