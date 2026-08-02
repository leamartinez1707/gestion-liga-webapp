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
  cardType: "yellow" | "red"
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
 * Calculate how many matches a player is suspended for based on card type
 * and existing yellow card count.
 *
 * Rules:
 * - Red card = 1 match suspension (configurable)
 * - Two yellows in same match = red card
 */
export function calculateSuspension(
  cardType: "yellow" | "red",
  existingYellowCards: number
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

export async function processMatchSanctions(
  matchId: string,
  redCardPlayerIds: string[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Get match details
    const { data: match } = await (supabase.from("matches") as any)
      .select("*")
      .eq("id", matchId)
      .single()

    if (!match) return { error: "Partido no encontrado" }

    const tournamentId = match.tournament_id
    const matchday = match.matchday
    const matchDate = match.date

    // Create sanction for each red card player
    for (const playerId of redCardPlayerIds) {
      const { matchesSuspended } = calculateSuspension("red", 0)

      await (supabase.from("sanctions") as any).insert({
        player_id: playerId,
        match_id: matchId,
        card_type: "red",
        match_date: matchDate,
        matches_suspended: matchesSuspended,
        expires_after_match: matchday ? matchday + matchesSuspended : null,
      })
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
    const { data: inserted, error } = await (supabase.from("sanctions") as any)
      .insert({
        player_id: data.playerId,
        match_id: data.matchId ?? null,
        card_type: data.cardType,
        match_date: data.matchDate,
        matches_suspended: data.matchesSuspended ?? 0,
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
    const { error } = await (supabase.from("sanctions") as any)
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
    cardType: (row.card_type as "yellow" | "red") ?? "yellow",
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
