-- =============================================================================
-- Hasta 2 delegados por equipo. Las cuentas las crea el admin desde la app
-- (Usuarios) con la secret key en el servidor; acá solo cambian las reglas de
-- asignación.
-- =============================================================================

create or replace function public.assign_delegate(p_team_id uuid, p_email text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_count integer;
begin
  if not public.is_staff() then raise exception 'No autorizado.'; end if;

  select * into v_profile from public.profiles where lower(email) = lower(trim(p_email));
  if not found then raise exception 'No se encontró un usuario con ese email.'; end if;
  if v_profile.role <> 'delegate' then
    raise exception 'Ese usuario no es delegado (es administrador o árbitro).';
  end if;
  if v_profile.team_id = p_team_id then return; end if;

  select count(*) into v_count from public.profiles where team_id = p_team_id and role = 'delegate';
  if v_count >= 2 then raise exception 'El equipo ya tiene 2 delegados. Quitá uno primero.'; end if;

  update public.profiles set team_id = p_team_id where id = v_profile.id;
end;
$$;

-- Quita a un delegado puntual de su equipo (la cuenta sigue existiendo)
create or replace function public.unassign_delegate(p_profile_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_staff() then raise exception 'No autorizado.'; end if;
  update public.profiles set team_id = null where id = p_profile_id and role = 'delegate';
end;
$$;

revoke execute on function public.unassign_delegate(uuid) from public, anon;
grant execute on function public.unassign_delegate(uuid) to authenticated;
