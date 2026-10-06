import { createReadOnlyClient, createClient } from "@/lib/supabase/server"
import { fetchAll } from "./fetch-all"

export interface GoalScorer {
  playerId: string
  playerName: string
  playerPhoto: string | null
  teamId: string
  teamName: string
  teamShortName: string
  teamShield: string | null
  goals: number
}

/**
 * Top scorers, optionally limited to some teams (e.g. one division) and/or to
 * matches of some tournaments.
 */
export async function getTopScorers(
  limit = 20,
  filter: { teamIds?: string[]; tournamentIds?: string[] } = {}
): Promise<{ data: GoalScorer[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()

    if (filter.teamIds && filter.teamIds.length === 0) return { data: [], error: null }

    // Aggregated in SQL (public.top_scorers): reading all goals rows would hit the API row cap
    const { data, error } = await supabase.rpc("top_scorers", {
      p_limit: limit,
      p_tournament_ids: filter.tournamentIds,
      p_team_ids: filter.teamIds,
    })
    if (error) return { data: null, error: error.message }

    const scorers: GoalScorer[] = (data ?? []).map((row) => ({
      playerId: row.player_id,
      playerName: row.player_name,
      playerPhoto: row.player_photo,
      teamId: row.team_id,
      teamName: row.team_name ?? "—",
      teamShortName: row.team_short_name ?? "—",
      teamShield: row.team_shield,
      goals: Number(row.goals),
    }))

    return { data: scorers, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function saveMatchGoals(
  matchId: string,
  scorers: { playerId: string; goals: number }[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Delete existing goals for this match
    await supabase.from("goals").delete().eq("match_id", matchId)

    // Insert new goals
    if (scorers.length > 0) {
      const rows = scorers.map((s) => ({
        match_id: matchId,
        player_id: s.playerId,
        goals: s.goals,
      }))

      const { error } = await supabase.from("goals").insert(rows)
      if (error) return { error: error.message }
    }

    return {}
  } catch {
    return { error: "No se pudieron guardar los goles." }
  }
}

/** Scorers of each match (for prefilling the result form). */
export async function getGoalsByMatch(
  matchIds: string[]
): Promise<Map<string, { playerId: string; goals: number }[]>> {
  const byMatch = new Map<string, { playerId: string; goals: number }[]>()
  if (matchIds.length === 0) return byMatch
  try {
    const supabase = createReadOnlyClient()
    const { data } = await fetchAll((from, to) =>
      supabase.from("goals").select("match_id, player_id, goals").in("match_id", matchIds).order("id").range(from, to)
    )
    for (const row of data) {
      if (!row.match_id || !row.player_id) continue
      byMatch.set(row.match_id, [...(byMatch.get(row.match_id) ?? []), { playerId: row.player_id, goals: row.goals }])
    }
  } catch {
    // Prefill is best effort
  }
  return byMatch
}
