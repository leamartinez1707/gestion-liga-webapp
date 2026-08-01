import type { Sponsor } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getSponsors(): Promise<{ data: Sponsor[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .order("display_order")
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function createSponsor(data: {
  name: string
  logoUrl: string
  linkUrl?: string
  displayOrder?: number
}): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("sponsors") as any)
      .insert({
        name: data.name,
        logo_url: data.logoUrl,
        link_url: data.linkUrl ?? null,
        display_order: data.displayOrder ?? 0,
      })
      .select()
      .single()
    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear el sponsor." }
  }
}

export async function updateSponsor(id: string, data: {
  name?: string
  logoUrl?: string
  linkUrl?: string | null
  displayOrder?: number
}): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl
    if (data.linkUrl !== undefined) payload.link_url = data.linkUrl
    if (data.displayOrder !== undefined) payload.display_order = data.displayOrder
    const { error } = await (supabase.from("sponsors") as any).update(payload).eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el sponsor." }
  }
}

export async function deleteSponsor(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("sponsors") as any).delete().eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar el sponsor." }
  }
}

function mapRow(row: Record<string, unknown>): Sponsor {
  return {
    id: row.id as string,
    name: row.name as string,
    logoUrl: row.logo_url as string,
    linkUrl: (row.link_url as string) ?? undefined,
    displayOrder: (row.display_order as number) ?? 0,
  }
}
