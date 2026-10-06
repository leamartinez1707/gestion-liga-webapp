import { createClient } from "@/lib/supabase/server"
import { getSessionProfile } from "@/lib/auth"
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

export async function getDelegateTeam(): Promise<{ data: Team | null; error: string | null }> {
  try {
    const profile = await getSessionProfile()
    if (!profile) return { data: null, error: "No autenticado." }
    if (!profile.teamId) return { data: null, error: "No tenés un equipo asignado." }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", profile.teamId)
      .single()

    if (error || !data) return { data: null, error: "Equipo no encontrado." }

    return { data: mapTeamRow(data), error: null }
  } catch {
    return { data: null, error: "No se pudo obtener el equipo." }
  }
}

/** Staff only — enforced by the assign_delegate RPC (security definer). */
export async function assignDelegate(
  teamId: string,
  email: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("assign_delegate", {
      p_team_id: teamId,
      p_email: email,
    })
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo asignar el delegado." }
  }
}
