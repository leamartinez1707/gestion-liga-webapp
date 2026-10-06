import { createReadOnlyClient } from "@/lib/supabase/server"

/** What a player did in one match. */
export interface PlayerMatchLine {
  matchId: string
  goals: number
  assists: number
  yellow: number
  red: number
}

/**
 * Goals (goals table: sheet or panel), assists (live sheet) and cards
 * (sanctions from the sheet or the panel), grouped by match.
 */
export async function getPlayerMatchLines(playerId: string): Promise<PlayerMatchLine[]> {
  try {
    const supabase = createReadOnlyClient()
    const [goals, assists, cards] = await Promise.all([
      supabase.from("goals").select("match_id, goals").eq("player_id", playerId),
      supabase.from("match_events").select("match_id").eq("assist_player_id", playerId),
      supabase.from("sanctions").select("match_id, card_type").eq("player_id", playerId).in("card_type", ["yellow", "red"]),
    ])

    const byMatch = new Map<string, PlayerMatchLine>()
    const line = (matchId: string) => {
      let l = byMatch.get(matchId)
      if (!l) byMatch.set(matchId, (l = { matchId, goals: 0, assists: 0, yellow: 0, red: 0 }))
      return l
    }
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
