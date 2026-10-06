import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

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

    const { data, error } = await supabase
      .from("goals")
      .select(`
        player_id,
        goals,
        match:match_id(tournament_id),
        player:player_id(name, photo_url, team_id, team:team_id(name, short_name, shield_url))
      `)

    if (error) return { data: null, error: error.message }

    const teamIds = filter.teamIds ? new Set(filter.teamIds) : null
    const tournamentIds = filter.tournamentIds ? new Set(filter.tournamentIds) : null

    // Aggregate in JS: PostgREST has no GROUP BY across embedded resources
    const byPlayer = new Map<string, GoalScorer>()
    for (const row of data ?? []) {
      const player = row.player
      if (!row.player_id || !player?.team_id) continue
      if (teamIds && !teamIds.has(player.team_id)) continue
      if (tournamentIds && !(row.match?.tournament_id && tournamentIds.has(row.match.tournament_id))) continue

      const existing = byPlayer.get(row.player_id)
      if (existing) {
        existing.goals += row.goals ?? 0
        continue
      }
      byPlayer.set(row.player_id, {
        playerId: row.player_id,
        playerName: player.name,
        playerPhoto: player.photo_url,
        teamId: player.team_id,
        teamName: player.team?.name ?? "—",
        teamShortName: player.team?.short_name ?? "—",
        teamShield: player.team?.shield_url ?? null,
        goals: row.goals ?? 0,
      })
    }

    const scorers = [...byPlayer.values()]
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
      .slice(0, limit)

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
    const { data } = await supabase.from("goals").select("match_id, player_id, goals").in("match_id", matchIds)
    for (const row of data ?? []) {
      if (!row.match_id || !row.player_id) continue
      byMatch.set(row.match_id, [...(byMatch.get(row.match_id) ?? []), { playerId: row.player_id, goals: row.goals }])
    }
  } catch {
    // Prefill is best effort
  }
  return byMatch
}
