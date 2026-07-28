import { generateRoundRobin } from "@/lib/db/fixtures"
import { createClient } from "@/lib/supabase/server"

/**
 * Generate and bulk-insert matches from a fixture for a tournament.
 * Server-only — uses supabase admin client.
 */
export async function bulkCreateMatches(
  tournamentId: string,
  teamIds: string[]
): Promise<{ error?: string; count?: number }> {
  try {
    const fixtures = generateRoundRobin(teamIds)
    const supabase = await createClient()

    const rows = fixtures.map((f) => ({
      tournament_id: tournamentId,
      home_team_id: f.homeTeamId,
      away_team_id: f.awayTeamId,
      matchday: f.matchday,
      status: "scheduled" as const,
    }))

    const { error } = await (supabase.from("matches") as any).insert(rows)
    if (error) return { error: error.message }
    return { count: rows.length }
  } catch {
    return {
      error: "No se pudieron generar los partidos. Verificá que Supabase esté configurado.",
    }
  }
}
