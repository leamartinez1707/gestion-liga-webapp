import type { Tournament } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

export async function getTournaments(): Promise<Tournament[]> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("tournaments") as any)
      .select("*")
      .order("created_at", { ascending: false })
    if (!data) return []
    return data.map(mapRow)
  } catch {
    const { tournaments } = await import("@/lib/data/tournaments")
    return tournaments
  }
}

export async function getTournament(id: string): Promise<Tournament | null> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("tournaments") as any)
      .select("*")
      .eq("id", id)
      .single()
    return data ? mapRow(data) : null
  } catch {
    const { tournaments } = await import("@/lib/data/tournaments")
    return tournaments.find((t) => t.id === id) ?? null
  }
}

export async function createTournament(
  data: Pick<Tournament, "name" | "category" | "season" | "format"> & {
    startDate?: string
    endDate?: string
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("tournaments") as any)
      .insert({
        name: data.name,
        category: data.category,
        season: data.season,
        format: data.format,
        start_date: data.startDate ?? null,
        end_date: data.endDate ?? null,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return {
      error: "No se pudo crear el torneo. Verificá que Supabase esté configurado.",
    }
  }
}

export async function updateTournament(
  id: string,
  data: Partial<
    Pick<Tournament, "name" | "category" | "season" | "format"> & {
      startDate?: string | null
      endDate?: string | null
    }
  >
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.category !== undefined) payload.category = data.category
    if (data.season !== undefined) payload.season = data.season
    if (data.format !== undefined) payload.format = data.format
    if (data.startDate !== undefined) payload.start_date = data.startDate
    if (data.endDate !== undefined) payload.end_date = data.endDate

    const { error } = await (supabase.from("tournaments") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el torneo." }
  }
}

export async function deleteTournament(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("tournaments") as any)
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar el torneo." }
  }
}

function mapRow(row: Record<string, unknown>): Tournament {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    season: row.season as string,
    format: row.format as Tournament["format"],
    startDate: (row.start_date as string) ?? undefined,
    endDate: (row.end_date as string) ?? undefined,
  }
}
