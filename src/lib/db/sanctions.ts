import type { Sanction, PaginatedResult } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getSanctionsPaginated(
  page = 1,
  limit = 10
): Promise<PaginatedResult<SanctionWithDetails>> {
  try {
    const supabase = createReadOnlyClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("sanctions")
      .select(`*, player:player_id(name, team_id), match:match_id(home_team_id, away_team_id, home_score, away_score, matchday)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) return { data: [], total: 0, page, totalPages: 0, error: error.message }
    return {
      data: (data ?? []).map(mapRowWithDetails),
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      error: null,
    }
  } catch {
    return { data: [], total: 0, page, totalPages: 0, error: "No se pudo conectar con la base de datos." }
  }
}

// ---------------------------------------------------------------------------
// Sanction types for the data layer (snake_case from DB mapped to camelCase)
// ---------------------------------------------------------------------------

export interface SanctionRow {
  id: string
  playerId: string
  matchId: string | null
  cardType: "yellow" | "red" | "accumulation"
  matchDate: string | null
  matchesSuspended: number
  expiresAfterMatch: number | null
}

export interface SanctionWithDetails extends SanctionRow {
  playerName: string
  teamName: string
  matchLabel: string | null
}

// ---------------------------------------------------------------------------
// Suspension logic (pure functions)
// ---------------------------------------------------------------------------

/**
 * Matches of suspension for a card. Red = 1 fecha (more can be set by hand
 * on the Sanciones page); a yellow is only recorded.
 */
export function calculateSuspension(
  cardType: "yellow" | "red"
): { matchesSuspended: number } {
  if (cardType === "red") {
    return { matchesSuspended: 1 }
  }

  // A yellow by itself doesn't cause suspension unless it's the second one
  // But for tracking purposes, we just record it
  return { matchesSuspended: 0 }
}

// ---------------------------------------------------------------------------
// Auto-sanction processing
// ---------------------------------------------------------------------------

/**
 * Makes the match's red cards match the form: adds the missing ones (1 fecha
 * of suspension each) and removes the ones that were unchecked. Saving the
 * result again no longer duplicates sanctions.
 */
export async function syncMatchRedCards(
  matchId: string,
  redCardPlayerIds: string[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const { data: match } = await supabase
      .from("matches")
      .select("date, matchday")
      .eq("id", matchId)
      .single()
    if (!match) return { error: "Partido no encontrado" }

    const { data: existing } = await supabase
      .from("sanctions")
      .select("id, player_id")
      .eq("match_id", matchId)
      .eq("card_type", "red")

    const wanted = new Set(redCardPlayerIds)
    const have = new Set((existing ?? []).map((s) => s.player_id))

    const toRemove = (existing ?? []).filter((s) => !s.player_id || !wanted.has(s.player_id)).map((s) => s.id)
    if (toRemove.length > 0) {
      const { error } = await supabase.from("sanctions").delete().in("id", toRemove)
      if (error) return { error: error.message }
    }

    const toAdd = [...wanted].filter((id) => !have.has(id))
    if (toAdd.length > 0) {
      const { data: settings } = await supabase.from("league_settings").select("red_card_matches").maybeSingle()
      const matchesSuspended = settings?.red_card_matches ?? calculateSuspension("red").matchesSuspended
      const { error } = await supabase.from("sanctions").insert(
        toAdd.map((playerId) => ({
          player_id: playerId,
          match_id: matchId,
          card_type: "red",
          match_date: match.date,
          matches_suspended: matchesSuspended,
          expires_after_match: match.matchday ? match.matchday + matchesSuspended : null,
          source: "match",
        }))
      )
      if (error) return { error: error.message }
    }

    return {}
  } catch {
    return { error: "No se pudieron procesar las sanciones." }
  }
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function getSanctions(): Promise<{ data: SanctionWithDetails[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("sanctions")
      .select(`
        *,
        player:player_id (name, team_id),
        match:match_id (home_team_id, away_team_id, home_score, away_score, matchday)
      `)
      .order("created_at", { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRowWithDetails), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getSanction(id: string): Promise<{ data: SanctionWithDetails | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("sanctions")
      .select(`
        *,
        player:player_id (name, team_id),
        match:match_id (home_team_id, away_team_id, home_score, away_score, matchday)
      `)
      .eq("id", id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRowWithDetails(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function createSanction(
  data: Pick<Sanction, "playerId" | "cardType" | "matchDate"> & {
    matchId?: string
    matchesSuspended?: number
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const matchesSuspended = data.matchesSuspended ?? 0

    // Last matchday the player misses (used to know when the suspension ends)
    let expiresAfterMatch: number | null = null
    if (data.matchId) {
      const { data: match } = await supabase.from("matches").select("matchday").eq("id", data.matchId).maybeSingle()
      if (match?.matchday) expiresAfterMatch = match.matchday + matchesSuspended
    }

    const { data: inserted, error } = await supabase.from("sanctions")
      .insert({
        player_id: data.playerId,
        match_id: data.matchId ?? null,
        card_type: data.cardType,
        match_date: data.matchDate,
        matches_suspended: matchesSuspended,
        expires_after_match: expiresAfterMatch,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear la sanción. Verificá que Supabase esté configurado." }
  }
}

export async function deleteSanction(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("sanctions")
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar la sanción." }
  }
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapRowWithDetails(row: Record<string, unknown>): SanctionWithDetails {
  const player = row.player as Record<string, unknown> | undefined
  const match = row.match as Record<string, unknown> | undefined

  return {
    id: row.id as string,
    playerId: row.player_id as string,
    matchId: (row.match_id as string) ?? null,
    cardType: (row.card_type as SanctionRow["cardType"]) ?? "yellow",
    matchDate: (row.match_date as string) ?? null,
    matchesSuspended: (row.matches_suspended as number) ?? 0,
    expiresAfterMatch: (row.expires_after_match as number) ?? null,
    playerName: (player?.name as string) ?? "Desconocido",
    teamName: "", // Will be filled from teams data
    matchLabel: match
      ? `Fecha ${match.matchday ?? "?"}`
      : null,
  }
}
