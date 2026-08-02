import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export interface GoalScorer {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  teamShortName: string
  goals: number
}

export async function getTopScorers(limit = 20): Promise<{ data: GoalScorer[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()

    // Aggregate goals by player with a join
    const { data, error } = await (supabase
      .from("goals") as any)
      .select(`
        player_id,
        goals,
        player:player_id(name, team_id)
      `)

    if (error) return { data: null, error: error.message }

    // Aggregate manually since Supabase doesn't do GROUP BY with joins well
    const playerMap = new Map<string, { name: string; teamId: string; goals: number }>()

    for (const row of data ?? []) {
      const pid = row.player_id as string
      const existing = playerMap.get(pid)
      playerMap.set(pid, {
        name: (row.player as any)?.name ?? "Desconocido",
        teamId: (row.player as any)?.team_id ?? "",
        goals: (existing?.goals ?? 0) + ((row.goals as number) ?? 0),
      })
    }

    // Get all team names
    const { data: teams } = await supabase.from("teams").select("id, name, short_name")

    const teamMap = new Map((teams ?? []).map((t: any) => [t.id, t]))

    const scorers: GoalScorer[] = [...playerMap.entries()]
      .map(([playerId, info]) => ({
        playerId,
        playerName: info.name,
        teamId: info.teamId,
        teamName: teamMap.get(info.teamId)?.name ?? "—",
        teamShortName: teamMap.get(info.teamId)?.short_name ?? "—",
        goals: info.goals,
      }))
      .sort((a, b) => b.goals - a.goals)
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
    await (supabase.from("goals") as any).delete().eq("match_id", matchId)

    // Insert new goals
    if (scorers.length > 0) {
      const rows = scorers.map((s) => ({
        match_id: matchId,
        player_id: s.playerId,
        goals: s.goals,
      }))

      const { error } = await (supabase.from("goals") as any).insert(rows)
      if (error) return { error: error.message }
    }

    return {}
  } catch {
    return { error: "No se pudieron guardar los goles." }
  }
}
