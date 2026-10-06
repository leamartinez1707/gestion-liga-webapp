import type { Match, MatchEvent } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at")
    return (data ?? []).map((row) => ({
      id: row.id,
      matchId: row.match_id,
      teamId: row.team_id,
      playerId: row.player_id ?? undefined,
      type: row.type as MatchEvent["type"],
      period: (row.period as MatchEvent["period"]) ?? undefined,
      createdAt: row.created_at ?? "",
    }))
  } catch {
    return []
  }
}

/** Ids of matches that have a live sheet (their result comes from the sheet). */
export async function getMatchIdsWithEvents(matchIds: string[]): Promise<Set<string>> {
  if (matchIds.length === 0) return new Set()
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase.from("match_events").select("match_id").in("match_id", matchIds)
    return new Set((data ?? []).map((r) => r.match_id))
  } catch {
    return new Set()
  }
}

/** Staff or the assigned referee (RLS + RPC). Recomputes score, scorers and cards. */
export async function addMatchEvent(event: {
  matchId: string
  teamId: string
  playerId: string | null
  type: MatchEvent["type"]
  period: MatchEvent["period"] | null
}): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("match_events").insert({
      match_id: event.matchId,
      team_id: event.teamId,
      player_id: event.playerId,
      type: event.type,
      period: event.period,
    })
    if (error) return { error: error.message }
    return recompute(event.matchId)
  } catch {
    return { error: "No se pudo guardar." }
  }
}

export async function deleteMatchEvent(eventId: string, matchId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("match_events").delete().eq("id", eventId).eq("match_id", matchId)
    if (error) return { error: error.message }
    return recompute(matchId)
  } catch {
    return { error: "No se pudo borrar." }
  }
}

async function recompute(matchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("recompute_match", { p_match_id: matchId })
  return error ? { error: error.message } : {}
}

export async function setMatchLiveState(
  matchId: string,
  status: Extract<Match["status"], "scheduled" | "ongoing" | "finished">,
  period: Match["livePeriod"] | null
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("set_match_live_state", {
      p_match_id: matchId,
      p_status: status,
      p_period: period ?? null,
    })
    return error ? { error: error.message } : {}
  } catch {
    return { error: "No se pudo actualizar el partido." }
  }
}
