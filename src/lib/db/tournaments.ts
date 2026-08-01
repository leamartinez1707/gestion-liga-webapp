import type { Tournament, PaginatedResult } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getTournamentsPaginated(
  page = 1,
  limit = 10
): Promise<PaginatedResult<Tournament>> {
  try {
    const supabase = createReadOnlyClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("tournaments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) return { data: [], total: 0, page, totalPages: 0, error: error.message }
    return {
      data: (data ?? []).map(mapRow),
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      error: null,
    }
  } catch {
    return { data: [], total: 0, page, totalPages: 0, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getTournaments(): Promise<{ data: Tournament[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getTournament(id: string): Promise<{ data: Tournament | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRow(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
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
    return { error: "No se pudo crear el torneo. Verificá que Supabase esté configurado." }
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
    category: (row.category as string) ?? "",
    seriesId: (row.series_id as string) ?? undefined,
    divisionId: (row.division_id as string) ?? undefined,
    season: row.season as string,
    format: row.format as Tournament["format"],
    startDate: (row.start_date as string) ?? undefined,
    endDate: (row.end_date as string) ?? undefined,
  }
}
