import type { Match, Player } from "@/lib/types"
import { createClient, createReadOnlyClient } from "@/lib/supabase/server"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getLeagueSettings } from "@/lib/db/settings"
import { fetchAllIn } from "./fetch-all"

export interface LineupEntry {
  playerId: string
  teamId: string
  /** Refuerzo: not on the tournament's lista de buena fe */
  isGuest: boolean
}

/** Who played a match (public). */
export async function getLineup(matchId: string): Promise<LineupEntry[]> {
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase.from("match_lineups").select("player_id, team_id, is_guest").eq("match_id", matchId).order("created_at")
    return (data ?? []).map((r) => ({ playerId: r.player_id, teamId: r.team_id, isGuest: r.is_guest }))
  } catch {
    return []
  }
}

/** Matches played per player over a set of matches (PJ). */
export async function getAppearanceCounts(matchIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (matchIds.length === 0) return counts
  try {
    const supabase = createReadOnlyClient()
    // One row per player and match: a season goes past the API row cap, so it's paged (and chunked)
    const { data } = await fetchAllIn(matchIds, (ids, from, to) =>
      supabase.from("match_lineups").select("player_id").in("match_id", ids).order("id").range(from, to)
    )
    for (const r of data) counts.set(r.player_id, (counts.get(r.player_id) ?? 0) + 1)
  } catch {
    // Stats are best effort
  }
  return counts
}

/** Ids of the matches a player played. */
export async function getPlayerMatchIds(playerId: string): Promise<Set<string>> {
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase.from("match_lineups").select("match_id").eq("player_id", playerId)
    return new Set((data ?? []).map((r) => r.match_id))
  } catch {
    return new Set()
  }
}

/** Ids of the team's lista de buena fe for a tournament (empty = the team has no list). */
export async function getTournamentRoster(tournamentId: string, teamId: string): Promise<Set<string>> {
  const { data: registrations } = await getRegistrations({ tournamentId, teamId })
  const registration = (registrations ?? [])[0]
  if (!registration) return new Set()
  const { data: rosters } = await getRosters([registration.id])
  return new Set(rosters.get(registration.id) ?? [])
}

/** Matches a player already played as refuerzo in a tournament (excluding one match). */
async function guestAppearances(playerId: string, tournamentId: string, exceptMatchId: string): Promise<number> {
  const supabase = createReadOnlyClient()
  // Counted by the DB, filtering on the match's tournament (no list of match ids in the URL)
  const { count } = await supabase
    .from("match_lineups")
    .select("id, match:match_id!inner(tournament_id)", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("is_guest", true)
    .eq("match.tournament_id", tournamentId)
    .neq("match_id", exceptMatchId)
  return count ?? 0
}

/**
 * Can this player play this match for this team? Players on the lista de buena
 * fe can; if the team has no list, any of its players can. Anyone else is a
 * refuerzo: only if the league allows them, up to its limit per tournament.
 */
export async function checkEligibility(
  match: Match,
  teamId: string,
  player: Player
): Promise<{ error?: string; isGuest?: boolean }> {
  if (player.teamId !== teamId) return { error: `${player.name} no es de ese equipo.` }

  const roster = await getTournamentRoster(match.tournamentId, teamId)
  if (roster.size === 0 || roster.has(player.id)) return { isGuest: false }

  const settings = await getLeagueSettings()
  if (!settings.guestPlayersAllowed) {
    return { error: `${player.name} no está en la lista de buena fe y la liga no permite refuerzos.` }
  }
  if (settings.guestPlayerMaxMatches > 0) {
    const played = await guestAppearances(player.id, match.tournamentId, match.id)
    if (played >= settings.guestPlayerMaxMatches) {
      return {
        error: `${player.name} ya jugó ${played} ${played === 1 ? "partido" : "partidos"} como refuerzo en este torneo (máximo ${settings.guestPlayerMaxMatches}).`,
      }
    }
  }
  return { isGuest: true }
}

/** Referee or staff (RLS). Adding twice is a no-op. */
export async function addToLineup(matchId: string, entry: LineupEntry): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("match_lineups")
      .upsert(
        { match_id: matchId, team_id: entry.teamId, player_id: entry.playerId, is_guest: entry.isGuest },
        { onConflict: "match_id,player_id", ignoreDuplicates: true }
      )
    return error ? { error: error.message } : {}
  } catch {
    return { error: "No se pudo guardar." }
  }
}

export async function removeFromLineup(matchId: string, playerId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("match_lineups").delete().eq("match_id", matchId).eq("player_id", playerId)
    return error ? { error: error.message } : {}
  } catch {
    return { error: "No se pudo guardar." }
  }
}
