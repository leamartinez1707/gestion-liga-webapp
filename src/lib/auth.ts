import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export type Role = "superadmin" | "editor" | "delegate" | "referee"

export interface SessionProfile {
  id: string
  email: string
  role: Role
  teamId: string | null
}

/**
 * Profile of the signed-in user, or null if there is no session/profile.
 * Cached per request so layouts, pages and actions can call it freely.
 */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, team_id")
    .eq("id", user.id)
    .maybeSingle()
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    role: data.role as Role,
    teamId: data.team_id ?? null,
  }
})

export function isStaff(profile: SessionProfile | null): boolean {
  return profile?.role === "superadmin" || profile?.role === "editor"
}

type Guard<T> = { profile: T; error?: undefined } | { profile?: undefined; error: string }

/** Server Actions are public POST endpoints: every admin action must call this. */
export async function requireStaff(): Promise<Guard<SessionProfile>> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "Tenés que iniciar sesión." }
  if (!isStaff(profile)) return { error: "No tenés permisos para realizar esta acción." }
  return { profile }
}

/** For delegate actions: returns the delegate's own team, never one taken from the form. */
export async function requireDelegateTeam(): Promise<Guard<SessionProfile & { teamId: string }>> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "Tenés que iniciar sesión." }
  if (profile.role !== "delegate" || !profile.teamId) {
    return { error: "No tenés un equipo asignado." }
  }
  return { profile: { ...profile, teamId: profile.teamId } }
}

/** Where each role lands after logging in. */
export function homeFor(profile: SessionProfile): string {
  if (isStaff(profile)) return "/admin"
  if (profile.role === "referee") return "/arbitro"
  return "/delegado"
}

/** Live sheet: staff, or the referee assigned to this match (checked in the DB). */
export async function requireMatchEditor(matchId: string): Promise<Guard<SessionProfile>> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "Tenés que iniciar sesión." }
  if (isStaff(profile)) return { profile }
  if (profile.role !== "referee") return { error: "No tenés permisos para cargar este partido." }

  const supabase = await createClient()
  const { data: allowed } = await supabase.rpc("can_edit_match", { p_match_id: matchId })
  if (!allowed) return { error: "Este partido no está asignado a vos." }
  return { profile }
}
