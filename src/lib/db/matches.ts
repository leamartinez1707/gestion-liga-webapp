import type { Match, PaginatedResult } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"
import { fetchAll, fetchAllIn } from "./fetch-all"
import { isUuid, uuids } from "./ids"

// Only the columns the app uses, plus the team names
const MATCH_SELECT = `
  id, home_team_id, away_team_id, date, time, home_score, away_score, status, matchday,
  tournament_id, venue, walkover, notes, referee_id, live_period,
  home_team:home_team_id (name),
  away_team:away_team_id (name)
` as const

export async function getMatchesPaginated(
  page = 1,
  limit = 10,
  /** Only matches of these tournaments (e.g. one season's) */
  tournamentIds?: string[]
): Promise<PaginatedResult<MatchWithTeams>> {
  if (tournamentIds?.length === 0) return { data: [], total: 0, page, totalPages: 0, error: null }
  try {
    const supabase = createReadOnlyClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase.from("matches").select(MATCH_SELECT, { count: "exact" })
    if (tournamentIds) query = query.in("tournament_id", tournamentIds)
    const { data, error, count } = await query
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .order("id")
      .range(from, to)

    if (error) return { data: [], total: 0, page, totalPages: 0, error: error.message }
    return {
      data: (data ?? []).map(mapRowWithTeams),
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      error: null,
    }
  } catch {
    return { data: [], total: 0, page, totalPages: 0, error: "No se pudo conectar con la base de datos." }
  }
}

export interface MatchWithTeams extends Match {
  homeTeamName: string
  awayTeamName: string
}

export interface MatchFilter {
  tournamentIds?: string[]
  ids?: string[]
  /** Matches the team played, home or away */
  teamId?: string
  refereeId?: string
  /** Matches on this date (YYYY-MM-DD) or live right now */
  dateOrLive?: string
  statuses?: Match["status"][]
  /** Newest first and at most this many (otherwise oldest first, all of them) */
  latest?: number
}

/**
 * Matches with team names. Pass a tournament id or a filter so only the
 * needed matches travel; without one it reads the whole fixture (paged).
 */
export async function getMatches(
  filter: string | MatchFilter = {}
): Promise<{ data: MatchWithTeams[] | null; error: string | null }> {
  const f: MatchFilter = typeof filter === "string" ? { tournamentIds: [filter] } : filter
  if (f.tournamentIds?.length === 0 || f.ids?.length === 0 || f.statuses?.length === 0) return { data: [], error: null }
  // These go inside .or() strings
  if ((f.teamId !== undefined && !isUuid(f.teamId)) || (f.dateOrLive !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(f.dateOrLive))) {
    return { data: [], error: null }
  }
  try {
    const supabase = createReadOnlyClient()
    const build = (ids = f.ids) => {
      let query = supabase.from("matches").select(MATCH_SELECT)
      if (f.tournamentIds) query = query.in("tournament_id", f.tournamentIds)
      if (ids) query = query.in("id", ids)
      if (f.teamId) query = query.or(`home_team_id.eq.${f.teamId},away_team_id.eq.${f.teamId}`)
      if (f.refereeId) query = query.eq("referee_id", f.refereeId)
      if (f.dateOrLive) query = query.or(`date.eq.${f.dateOrLive},status.eq.ongoing`)
      if (f.statuses) query = query.in("status", f.statuses)
      return query
    }
    if (f.latest !== undefined) {
      const { data, error } = await build()
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .order("id")
        .limit(f.latest)
      if (error) return { data: null, error: error.message }
      return { data: data.map(mapRowWithTeams), error: null }
    }
    // Paged: the whole fixture can exceed the API row cap. Long id lists go in chunks.
    const page = (ids: string[] | undefined, from: number, to: number) =>
      build(ids).order("date", { ascending: true }).order("time", { ascending: true }).order("id").range(from, to)
    const { data, error } = f.ids
      ? await fetchAllIn(f.ids, page)
      : await fetchAll((from, to) => page(undefined, from, to))
    if (error) return { data: null, error }
    return { data: data.map(mapRowWithTeams), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

/** Last finished meetings between two teams (any tournament), newest first. */
export async function getHeadToHead(
  teamA: string,
  teamB: string,
  { excludeId, limit = 6 }: { excludeId?: string; limit?: number } = {}
): Promise<MatchWithTeams[]> {
  if (!isUuid(teamA) || !isUuid(teamB)) return []
  try {
    const supabase = createReadOnlyClient()
    let query = supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("status", "finished")
      .or(`and(home_team_id.eq.${teamA},away_team_id.eq.${teamB}),and(home_team_id.eq.${teamB},away_team_id.eq.${teamA})`)
    if (excludeId) query = query.neq("id", excludeId)
    const { data } = await query.order("date", { ascending: false }).order("id").limit(limit)
    return (data ?? []).map(mapRowWithTeams)
  } catch {
    return []
  }
}

/**
 * Next matchday still to be played in each tournament (what suspensions are
 * measured against). Reads only the pending matches' tournament and matchday.
 */
export async function getNextMatchdays(tournamentIds: string[]): Promise<Map<string, number>> {
  const next = new Map<string, number>()
  const ids = uuids(tournamentIds)
  if (ids.length === 0) return next
  try {
    const supabase = createReadOnlyClient()
    const { data } = await fetchAll((from, to) =>
      supabase
        .from("matches")
        .select("tournament_id, matchday")
        .in("tournament_id", ids)
        .in("status", ["scheduled", "ongoing", "postponed"])
        .order("id")
        .range(from, to)
    )
    for (const m of data) {
      if (!m.tournament_id || m.matchday == null) continue
      const current = next.get(m.tournament_id)
      if (current === undefined || m.matchday < current) next.set(m.tournament_id, m.matchday)
    }
  } catch {
    // Suspensions are best effort
  }
  return next
}

export async function getMatch(id: string): Promise<{ data: MatchWithTeams | null; error: string | null }> {
  // Ids come from the URL: anything that isn't a uuid simply doesn't exist
  if (!isUuid(id)) return { data: null, error: null }
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
    walkover: boolean
    notes: string | null
    refereeId: string | null
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
    if (data.walkover !== undefined) payload.walkover = data.walkover
    if (data.notes !== undefined) payload.notes = data.notes
    if (data.refereeId !== undefined) payload.referee_id = data.refereeId

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
    venue: (row.venue as string) ?? undefined,
    walkover: (row.walkover as boolean) ?? false,
    notes: (row.notes as string) ?? undefined,
    refereeId: (row.referee_id as string) ?? undefined,
    livePeriod: (row.live_period as Match["livePeriod"]) ?? undefined,
    homeTeamName: homeTeam?.name as string ?? "",
    awayTeamName: awayTeam?.name as string ?? "",
  }
}
