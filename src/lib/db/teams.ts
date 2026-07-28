import type { Team } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

export async function getTeams(): Promise<Team[]> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("teams") as any)
      .select("*")
      .order("created_at", { ascending: false })
    if (!data) return []
    return data.map(mapRow)
  } catch {
    const { teams } = await import("@/lib/data/teams")
    return teams
  }
}

export async function getTeam(id: string): Promise<Team | null> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("teams") as any)
      .select("*")
      .eq("id", id)
      .single()
    return data ? mapRow(data) : null
  } catch {
    const { teams } = await import("@/lib/data/teams")
    return teams.find((t) => t.id === id) ?? null
  }
}

export async function createTeam(
  data: Pick<Team, "name" | "shortName" | "category"> & {
    coach?: string
    assistantCoach?: string
    tournamentId?: string
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
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return {
      error: "No se pudo crear el equipo. Verificá que Supabase esté configurado.",
    }
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
    category: row.category as string,
    coach: (row.coach as string) ?? "",
    assistantCoach: (row.assistant_coach as string) ?? undefined,
    tournamentId: (row.tournament_id as string) ?? undefined,
  }
}
