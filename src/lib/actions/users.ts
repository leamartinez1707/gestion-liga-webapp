"use server"

import { revalidatePath } from "next/cache"

import { requireStaff, type Role } from "@/lib/auth"
import { createUser, deleteUser, getTeamDelegates, getUser, resetUserPassword, updateUserRole } from "@/lib/db/users"
import { createClient } from "@/lib/supabase/server"

// User management. Rules:
// - staff (superadmin/editor) create and manage delegates and referees
// - only the superadmin creates or changes administrators
// - a team has at most 2 delegates
// - nobody can delete or demote themselves (the league never loses its admin)

const ROLES: Role[] = ["superadmin", "editor", "delegate", "referee"]
const isAdminRole = (role: Role) => role === "superadmin" || role === "editor"
const MAX_DELEGATES = 2

function refresh() {
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/equipos", "layout")
}

async function checkRolePermission(callerRole: Role, targetRoles: Role[]): Promise<string | null> {
  if (targetRoles.some(isAdminRole) && callerRole !== "superadmin") {
    return "Solo el superadmin puede gestionar administradores."
  }
  return null
}

async function checkDelegateSlot(teamId: string | null, exceptUserId?: string): Promise<string | null> {
  if (!teamId) return "Elegí el equipo del delegado."
  const delegates = await getTeamDelegates(teamId)
  if (delegates.filter((d) => d.id !== exceptUserId).length >= MAX_DELEGATES) {
    return "Ese equipo ya tiene 2 delegados. Quitá uno primero."
  }
  return null
}

export async function createUserAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (!auth.profile) return { error: auth.error }

  const email = (formData.get("email") as string | null)?.trim().toLowerCase()
  const password = (formData.get("password") as string | null) ?? ""
  const role = ROLES.find((r) => r === formData.get("role"))
  const teamId = (formData.get("teamId") as string | null) || null
  const displayName = (formData.get("displayName") as string | null)?.trim() || null

  if (!email) return { error: "El email es obligatorio." }
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." }
  if (!role) return { error: "Elegí el rol." }

  const denied = await checkRolePermission(auth.profile.role, [role])
  if (denied) return { error: denied }
  if (role === "delegate") {
    const full = await checkDelegateSlot(teamId)
    if (full) return { error: full }
  }

  const result = await createUser({ email, password, displayName, role, teamId: role === "delegate" ? teamId : null })
  if (result.error) return { error: result.error }
  refresh()
  return { success: true as const }
}

export async function updateUserRoleAction(userId: string, _prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (!auth.profile) return { error: auth.error }

  const role = ROLES.find((r) => r === formData.get("role"))
  const teamId = (formData.get("teamId") as string | null) || null
  const displayName = (formData.get("displayName") as string | null)?.trim() || null
  if (!role) return { error: "Elegí el rol." }

  const target = await getUser(userId)
  if (!target) return { error: "El usuario no existe." }
  if (target.id === auth.profile.id) return { error: "No podés cambiar tu propio rol." }

  const denied = await checkRolePermission(auth.profile.role, [role, target.role])
  if (denied) return { error: denied }
  if (role === "delegate") {
    const full = await checkDelegateSlot(teamId, target.id)
    if (full) return { error: full }
  }

  const result = await updateUserRole(userId, role, teamId, displayName)
  if (result.error) return { error: result.error }
  refresh()
  return { success: true as const }
}

export async function resetPasswordAction(userId: string, _prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (!auth.profile) return { error: auth.error }

  const password = (formData.get("password") as string | null) ?? ""
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." }

  const target = await getUser(userId)
  if (!target) return { error: "El usuario no existe." }
  const denied = await checkRolePermission(auth.profile.role, [target.role])
  if (denied) return { error: denied }

  const result = await resetUserPassword(userId, password)
  if (result.error) return { error: result.error }
  return { success: true as const }
}

export async function deleteUserAction(userId: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (!auth.profile) return { error: auth.error }

  const target = await getUser(userId)
  if (!target) return { error: "El usuario no existe." }
  if (target.id === auth.profile.id) return { error: "No podés eliminar tu propia cuenta." }
  const denied = await checkRolePermission(auth.profile.role, [target.role])
  if (denied) return { error: denied }

  const result = await deleteUser(userId)
  if (result.error) return { error: result.error }
  refresh()
  return {}
}

/** Team page: the account stays, it just stops managing this team. */
export async function unassignDelegateAction(userId: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (!auth.profile) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.rpc("unassign_delegate", { p_profile_id: userId })
  if (error) return { error: error.message }
  refresh()
  return {}
}
