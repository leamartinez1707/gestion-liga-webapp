import type { Team } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getTeamsByTournament(tournamentId: string): Promise<{ data: Team[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getTeams(): Promise<{ data: Team[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getTeam(id: string): Promise<{ data: Team | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRow(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function createTeam(
  data: Pick<Team, "name" | "shortName" | "category"> & {
    coach?: string
    assistantCoach?: string
    tournamentId?: string
    shieldUrl?: string | null
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("teams") as any)
      .insert({
        name: data.name,
        short_name: data.shortName,
        category: data.category,
        coach: data.coach ?? null,
        assistant_coach: data.assistantCoach ?? null,
        tournament_id: data.tournamentId ?? null,
        shield_url: data.shieldUrl ?? null,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear el equipo. Verificá que Supabase esté configurado." }
  }
}

export async function updateTeam(
  id: string,
  data: Partial<{
    name: string
    shortName: string
    category: string
    coach: string | null
    assistantCoach: string | null
    tournamentId: string | null
    shieldUrl: string | null
  }>
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.shortName !== undefined) payload.short_name = data.shortName
    if (data.category !== undefined) payload.category = data.category
    if (data.coach !== undefined) payload.coach = data.coach
    if (data.assistantCoach !== undefined)
      payload.assistant_coach = data.assistantCoach
    if (data.tournamentId !== undefined)
      payload.tournament_id = data.tournamentId
    if (data.shieldUrl !== undefined)
      payload.shield_url = data.shieldUrl

    const { error } = await (supabase.from("teams") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el equipo." }
  }
}

export async function deleteTeam(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("teams") as any)
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar el equipo." }
  }
}

function mapRow(row: Record<string, unknown>): Team {
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
