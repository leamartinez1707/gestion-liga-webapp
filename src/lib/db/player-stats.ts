import { createReadOnlyClient } from "@/lib/supabase/server"

/** What a player did in one match. */
export interface PlayerMatchLine {
  matchId: string
  /** On the lineup (the match counts as played) */
  played: boolean
  goals: number
  assists: number
  yellow: number
  red: number
}

/**
 * Matches played (lineup), goals (goals table: sheet or panel), assists (live sheet) and cards
 * (sanctions from the sheet or the panel), grouped by match.
 */
export async function getPlayerMatchLines(playerId: string): Promise<PlayerMatchLine[]> {
  try {
    const supabase = createReadOnlyClient()
    const [lineups, goals, assists, cards] = await Promise.all([
      supabase.from("match_lineups").select("match_id").eq("player_id", playerId),
      supabase.from("goals").select("match_id, goals").eq("player_id", playerId),
      supabase.from("match_events").select("match_id").eq("assist_player_id", playerId),
      supabase.from("sanctions").select("match_id, card_type").eq("player_id", playerId).in("card_type", ["yellow", "red"]),
    ])

    const byMatch = new Map<string, PlayerMatchLine>()
    const line = (matchId: string) => {
      let l = byMatch.get(matchId)
      if (!l) byMatch.set(matchId, (l = { matchId, played: false, goals: 0, assists: 0, yellow: 0, red: 0 }))
      return l
    }
    for (const r of lineups.data ?? []) line(r.match_id).played = true
    for (const g of goals.data ?? []) if (g.match_id) line(g.match_id).goals += g.goals ?? 0
    for (const a of assists.data ?? []) line(a.match_id).assists += 1
    for (const c of cards.data ?? []) {
      if (!c.match_id) continue
      if (c.card_type === "yellow") line(c.match_id).yellow += 1
      else line(c.match_id).red += 1
    }
    return [...byMatch.values()]
  } catch {
    return []
  }
}

/** Assists per player over a set of matches (live sheet). */
export async function getAssistCounts(matchIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (matchIds.length === 0) return counts
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase
      .from("match_events")
      .select("assist_player_id")
      .in("match_id", matchIds)
      .not("assist_player_id", "is", null)
    for (const row of data ?? []) {
      if (row.assist_player_id) counts.set(row.assist_player_id, (counts.get(row.assist_player_id) ?? 0) + 1)
    }
  } catch {
    // Stats are best effort
  }
  return counts
}
