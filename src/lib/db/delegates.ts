import { createClient } from "@/lib/supabase/server"
import type { Team } from "@/lib/types"

function mapTeamRow(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    shortName: row.short_name as string,
    shield: (row.shield_url as string) ?? "/placeholder.svg",
    category: (row.category as string) ?? "",
    seriesId: (row.series_id as string) ?? undefined,
    divisionId: (row.division_id as string) ?? undefined,
    coach: (row.coach as string) ?? "",
    assistantCoach: (row.assistant_coach as string) ?? undefined,
    tournamentId: (row.tournament_id as string) ?? undefined,
  }
}

export interface Profile {
  id: string
  email: string
  role: "superadmin" | "editor"
  teamId: string | null
}

export async function getProfile(): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "No autenticado." }

    const { data, error } = await (supabase
      .from("profiles") as any)
      .select("*")
      .eq("id", user.id)
      .single()

    if (error || !data) return { data: null, error: "Perfil no encontrado." }

    return {
      data: {
        id: data.id as string,
        email: data.email as string,
        role: data.role as "superadmin" | "editor",
        teamId: (data.team_id as string) ?? null,
      },
      error: null,
    }
  } catch {
    return { data: null, error: "No se pudo obtener el perfil." }
  }
}

export async function getDelegateTeam(): Promise<{ data: Team | null; error: string | null }> {
  try {
    const profile = await getProfile()
    if (profile.error || !profile.data) return { data: null, error: profile.error }
    if (!profile.data.teamId) return { data: null, error: "No tenés un equipo asignado." }

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from("teams") as any)
      .select("*")
      .eq("id", profile.data.teamId)
      .single()

    if (error || !data) return { data: null, error: "Equipo no encontrado." }

    return { data: mapTeamRow(data), error: null }
  } catch {
    return { data: null, error: "No se pudo obtener el equipo." }
  }
}

export async function assignDelegate(
  teamId: string,
  email: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Find user by email in auth.users (via admin API or profiles)
    const { data: profile, error: lookupError } = await (supabase
      .from("profiles") as any)
      .select("id, role")
      .eq("email", email)
      .single()

    if (lookupError || !profile) {
      return { error: "No se encontró un usuario con ese email." }
    }

    // Update profile with team_id
    const { error } = await (supabase
      .from("profiles") as any)
      .update({ team_id: teamId })
      .eq("id", profile.id)

    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo asignar el delegado." }
  }
}

export async function revokeDelegate(teamId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase
      .from("profiles") as any)
      .update({ team_id: null })
      .eq("team_id", teamId)

    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo revocar el delegado." }
  }
}

export async function getDelegateByTeam(teamId: string): Promise<{ data: { email: string } | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase
      .from("profiles") as any)
      .select("email")
      .eq("team_id", teamId)
      .single()

    if (error) return { data: null, error: null } // No delegate is not an error
    return { data: { email: data.email as string }, error: null }
  } catch {
    return { data: null, error: null }
  }
}
