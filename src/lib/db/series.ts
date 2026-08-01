import type { Series, Division } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export async function getSeries(): Promise<{ data: Series[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase.from("series").select("*").order("name")
    if (error) return { data: null, error: error.message }
    return { data: data.map(mapSeriesRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getSeriesById(id: string): Promise<{ data: Series | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase.from("series").select("*").eq("id", id).single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapSeriesRow(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getDivisions(seriesId?: string): Promise<{ data: Division[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    let query = supabase.from("divisions").select("*").order("display_order")
    if (seriesId) {
      query = query.eq("series_id", seriesId)
    }
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data.map(mapDivisionRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

// ---------------------------------------------------------------------------
// Series CRUD
// ---------------------------------------------------------------------------

export async function createSeries(data: {
  name: string
  description?: string
}): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const { data: inserted, error } = await (supabase.from("series") as any)
      .insert({ name: data.name, slug, description: data.description ?? null })
      .select()
      .single()

    if (error) return { error: error.message }
    if (error?.code === "23505") return { error: "Ya existe una serie con ese nombre." }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear la serie." }
  }
}

export async function updateSeries(
  id: string,
  data: { name?: string; description?: string | null }
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) {
      payload.name = data.name
      payload.slug = data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    }
    if (data.description !== undefined) payload.description = data.description

    const { error } = await (supabase.from("series") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar la serie." }
  }
}

export async function deleteSeries(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("series") as any).delete().eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar la serie." }
  }
}

// ---------------------------------------------------------------------------
// Division CRUD
// ---------------------------------------------------------------------------

export async function createDivision(data: {
  seriesId: string
  name: string
  displayOrder?: number
}): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()

    // Auto-increment display order if not provided
    let order = data.displayOrder
    if (order === undefined) {
      const { data: existing } = await (supabase.from("divisions") as any)
        .select("display_order")
        .eq("series_id", data.seriesId)
        .order("display_order", { ascending: false })
        .limit(1)
      order = existing?.[0] ? (existing[0].display_order as number) + 1 : 1
    }

    const { data: inserted, error } = await (supabase.from("divisions") as any)
      .insert({
        series_id: data.seriesId,
        name: data.name,
        display_order: order,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear la división." }
  }
}

export async function updateDivision(
  id: string,
  data: { name?: string; displayOrder?: number }
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.displayOrder !== undefined) payload.display_order = data.displayOrder

    const { error } = await (supabase.from("divisions") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar la división." }
  }
}

export async function deleteDivision(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("divisions") as any).delete().eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar la división." }
  }
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSeriesRow(row: Record<string, unknown>): Series {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? undefined,
  }
}

function mapDivisionRow(row: Record<string, unknown>): Division {
  return {
    id: row.id as string,
    seriesId: row.series_id as string,
    name: row.name as string,
    displayOrder: (row.display_order as number) ?? 0,
  }
}
