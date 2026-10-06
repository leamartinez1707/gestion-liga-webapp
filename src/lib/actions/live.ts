"use server"

import { revalidatePath } from "next/cache"

import type { Match, MatchEvent } from "@/lib/types"
import { requireMatchEditor } from "@/lib/auth"
import { getMatch } from "@/lib/db/matches"
import { getPlayer } from "@/lib/db/players"
import { addMatchEvent, deleteMatchEvent, setMatchLiveState } from "@/lib/db/match-events"

// Live sheet (planilla): the assigned referee or staff. Each action is saved
// right away and the DB recomputes score, scorers and cards.

const EVENT_TYPES: MatchEvent["type"][] = ["goal", "own_goal", "yellow", "red"]

function refresh(matchId: string) {
  // Public pages show the live score
  revalidatePath("/", "layout")
  revalidatePath(`/arbitro/partido/${matchId}`)
}

export async function addEventAction(
  matchId: string,
  input: { teamId: string; playerId: string | null; type: MatchEvent["type"] }
): Promise<{ error?: string }> {
  const auth = await requireMatchEditor(matchId)
  if (auth.error) return { error: auth.error }

  if (!EVENT_TYPES.includes(input.type)) return { error: "Dato inválido." }
  const { data: match } = await getMatch(matchId)
  if (!match) return { error: "El partido no existe." }
  if (input.teamId !== match.homeTeamId && input.teamId !== match.awayTeamId) {
    return { error: "Ese equipo no juega este partido." }
  }
  if (match.status === "cancelled" || match.status === "postponed") {
    return { error: "El partido está suspendido o cancelado." }
  }
  // Cards need a player; a goal can be "sin identificar"
  if ((input.type === "yellow" || input.type === "red") && !input.playerId) {
    return { error: "Elegí el jugador." }
  }
  if (input.playerId) {
    const { data: player } = await getPlayer(input.playerId)
    if (player?.teamId !== input.teamId) return { error: "El jugador no es de ese equipo." }
  }

  const period = match.livePeriod === "2T" ? "2T" : match.livePeriod === "1T" ? "1T" : null
  const result = await addMatchEvent({ matchId, teamId: input.teamId, playerId: input.playerId, type: input.type, period })
  if (result.error) return { error: result.error }

  // First event of a scheduled match: it's being played
  if (match.status === "scheduled") await setMatchLiveState(matchId, "ongoing", "1T")

  refresh(matchId)
  return {}
}

export async function deleteEventAction(matchId: string, eventId: string): Promise<{ error?: string }> {
  const auth = await requireMatchEditor(matchId)
  if (auth.error) return { error: auth.error }

  const result = await deleteMatchEvent(eventId, matchId)
  if (result.error) return { error: result.error }
  refresh(matchId)
  return {}
}

export async function setLiveStateAction(
  matchId: string,
  status: Extract<Match["status"], "scheduled" | "ongoing" | "finished">,
  period: Match["livePeriod"] | null
): Promise<{ error?: string }> {
  const auth = await requireMatchEditor(matchId)
  if (auth.error) return { error: auth.error }

  const result = await setMatchLiveState(matchId, status, period)
  if (result.error) return { error: result.error }
  refresh(matchId)
  return {}
}
