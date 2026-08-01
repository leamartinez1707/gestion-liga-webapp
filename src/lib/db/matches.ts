import type { Match } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export interface MatchWithTeams extends Match {
  homeTeamName: string
  awayTeamName: string
}

export async function getMatches(
  tournamentId?: string
): Promise<{ data: MatchWithTeams[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    let query = supabase.from("matches").select(`
        *,
        home_team:home_team_id (name),
        away_team:away_team_id (name)
      `)

    if (tournamentId) {
      query = query.eq("tournament_id", tournamentId)
    }

    const { data, error } = await query.order("date", { ascending: true }).order("time", { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRowWithTeams), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getMatch(id: string): Promise<{ data: MatchWithTeams | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:home_team_id (name),
        away_team:away_team_id (name)
      `)
      .eq("id", id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRowWithTeams(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function createMatch(
  data: Pick<Match, "homeTeamId" | "awayTeamId" | "date" | "time" | "matchday" | "tournamentId"> & {
    venue?: string
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("matches") as any)
      .insert({
        tournament_id: data.tournamentId,
        home_team_id: data.homeTeamId,
        away_team_id: data.awayTeamId,
        matchday: data.matchday,
        date: data.date,
        time: data.time,
        venue: data.venue ?? null,
        status: "scheduled",
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear el partido. Verificá que Supabase esté configurado." }
  }
}

export async function updateMatch(
  id: string,
  data: Partial<{
    homeTeamId: string
    awayTeamId: string
    date: string
    time: string
    matchday: number
    tournamentId: string
    homeScore: number | null
    awayScore: number | null
    status: Match["status"]
    venue: string | null
  }>
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.homeTeamId !== undefined) payload.home_team_id = data.homeTeamId
    if (data.awayTeamId !== undefined) payload.away_team_id = data.awayTeamId
    if (data.date !== undefined) payload.date = data.date
    if (data.time !== undefined) payload.time = data.time
    if (data.matchday !== undefined) payload.matchday = data.matchday
    if (data.tournamentId !== undefined) payload.tournament_id = data.tournamentId
    if (data.homeScore !== undefined) payload.home_score = data.homeScore
    if (data.awayScore !== undefined) payload.away_score = data.awayScore
    if (data.status !== undefined) payload.status = data.status
    if (data.venue !== undefined) payload.venue = data.venue

    const { error } = await (supabase.from("matches") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el partido." }
  }
}

export async function deleteMatch(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("matches") as any)
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar el partido." }
  }
}

export async function getMatchesByMatchday(
  tournamentId: string,
  matchday: number
): Promise<{ data: MatchWithTeams[] | null; error: string | null }> {
  const result = await getMatches(tournamentId)
  if (result.error) return result
  return { data: (result.data ?? []).filter((m) => m.matchday === matchday), error: null }
}

function mapRowWithTeams(row: Record<string, unknown>): MatchWithTeams {
  const homeTeam = row.home_team as Record<string, unknown> | undefined
  const awayTeam = row.away_team as Record<string, unknown> | undefined

  return {
    id: row.id as string,
    homeTeamId: row.home_team_id as string,
    awayTeamId: row.away_team_id as string,
    date: (row.date as string) ?? "",
    time: (row.time as string) ?? "",
    homeScore: (row.home_score as number) ?? undefined,
    awayScore: (row.away_score as number) ?? undefined,
    status: (row.status as Match["status"]) ?? "scheduled",
    matchday: (row.matchday as number) ?? 0,
    tournamentId: (row.tournament_id as string) ?? "",
    homeTeamName: homeTeam?.name as string ?? "",
    awayTeamName: awayTeam?.name as string ?? "",
  }
}
