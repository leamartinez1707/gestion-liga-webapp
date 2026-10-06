import type { Role } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

export interface LeagueUser {
  id: string
  email: string
  displayName: string | null
  role: Role
  teamId: string | null
  teamName: string | null
}

/** Staff only (profiles RLS). */
export async function getUsers(): Promise<{ data: LeagueUser[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, team_id, team:team_id(name)")
      .order("email")
    if (error) return { data: [], error: error.message }
    return {
      data: data.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role as Role,
        teamId: row.team_id,
        teamName: row.team?.name ?? null,
      })),
      error: null,
    }
  } catch {
    return { data: [], error: "No se pudieron cargar los usuarios." }
  }
}

export async function getUser(id: string): Promise<LeagueUser | null> {
  const { data } = await getUsers()
  return data.find((u) => u.id === id) ?? null
}

/** Delegates of a team (max 2). */
export async function getTeamDelegates(teamId: string): Promise<LeagueUser[]> {
  const { data } = await getUsers()
  return data.filter((u) => u.role === "delegate" && u.teamId === teamId)
}

function friendlyAuthError(message: string): string {
  if (/already been registered|already exists/i.test(message)) return "Ya existe una cuenta con ese email."
  if (/password/i.test(message)) return "La contraseña no es válida (mínimo 8 caracteres)."
  if (/email/i.test(message)) return "El email no es válido."
  return message
}

/**
 * Creates the account (already confirmed, so it can log in right away with the
 * password the admin shares) and sets its role/team. Callers check permissions.
 */
export async function createUser(input: {
  email: string
  password: string
  displayName: string | null
  role: Role
  teamId: string | null
}): Promise<{ error?: string }> {
  try {
    const admin = createServiceClient()
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })
    if (error || !data.user) return { error: friendlyAuthError(error?.message ?? "No se pudo crear la cuenta.") }

    // The on_auth_user_created trigger made a 'delegate' profile; set the real role
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id: data.user.id, email: input.email, display_name: input.displayName, role: input.role, team_id: input.teamId })
    if (profileError) return { error: profileError.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear la cuenta." }
  }
}

export async function updateUserRole(
  id: string,
  role: Role,
  teamId: string | null,
  displayName: string | null
): Promise<{ error?: string }> {
  try {
    const admin = createServiceClient()
    const { error } = await admin
      .from("profiles")
      .update({ role, team_id: role === "delegate" ? teamId : null, display_name: displayName })
      .eq("id", id)
    return error ? { error: error.message } : {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo actualizar el usuario." }
  }
}

export async function resetUserPassword(id: string, password: string): Promise<{ error?: string }> {
  try {
    const admin = createServiceClient()
    const { error } = await admin.auth.admin.updateUserById(id, { password })
    return error ? { error: friendlyAuthError(error.message) } : {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo cambiar la contraseña." }
  }
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  try {
    const admin = createServiceClient()
    // profiles.id references auth.users without cascade: remove the profile first
    const { error: profileError } = await admin.from("profiles").delete().eq("id", id)
    if (profileError) return { error: profileError.message }
    const { error } = await admin.auth.admin.deleteUser(id)
    return error ? { error: error.message } : {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo eliminar el usuario." }
  }
}
