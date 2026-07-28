import type { Player } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

export async function getPlayers(): Promise<Player[]> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("players") as any)
      .select("*")
      .order("created_at", { ascending: false })
    if (!data) return []
    return data.map(mapRow)
  } catch {
    const { players } = await import("@/lib/data/players")
    return players
  }
}

export async function getPlayersByTeam(
  teamId: string
): Promise<Player[]> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("players") as any)
      .select("*")
      .eq("team_id", teamId)
      .order("number", { ascending: true })
    if (!data) return []
    return data.map(mapRow)
  } catch {
    const { players } = await import("@/lib/data/players")
    return players.filter((p) => p.teamId === teamId)
  }
}

export async function getPlayer(
  id: string
): Promise<Player | null> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("players") as any)
      .select("*")
      .eq("id", id)
      .single()
    return data ? mapRow(data) : null
  } catch {
    const { players } = await import("@/lib/data/players")
    return players.find((p) => p.id === id) ?? null
  }
}

export async function createPlayer(
  data: Pick<Player, "name" | "number" | "position" | "teamId"> & {
    active?: boolean
    photo?: string
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("players") as any)
      .insert({
        name: data.name,
        number: data.number,
        position: data.position,
        team_id: data.teamId,
        photo_url: data.photo ?? null,
        active: data.active ?? true,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return {
      error: "No se pudo crear el jugador. Verificá que Supabase esté configurado.",
    }
  }
}

export async function updatePlayer(
  id: string,
  data: Partial<{
    name: string
    number: number
    position: Player["position"]
    teamId: string
    photo: string | null
    active: boolean
  }>
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.number !== undefined) payload.number = data.number
    if (data.position !== undefined) payload.position = data.position
    if (data.teamId !== undefined) payload.team_id = data.teamId
    if (data.photo !== undefined) payload.photo_url = data.photo
    if (data.active !== undefined) payload.active = data.active

    const { error } = await (supabase.from("players") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el jugador." }
  }
}

export async function deletePlayer(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("players") as any)
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar el jugador." }
  }
}

function mapRow(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    number: (row.number as number) ?? 0,
    position: (row.position as Player["position"]) ?? "delantero",
    photo: (row.photo_url as string) ?? undefined,
    teamId: (row.team_id as string) ?? "",
    active: (row.active as boolean) ?? true,
  }
}
