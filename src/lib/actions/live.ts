"use server"

import { revalidatePath } from "next/cache"

import type { Match, MatchEvent, Player } from "@/lib/types"
import { requireMatchEditor } from "@/lib/auth"
import { getMatch } from "@/lib/db/matches"
import { getPlayer, getPlayersByTeam } from "@/lib/db/players"
import { addMatchEvent, deleteMatchEvent, getMatchEvents, setMatchLiveState } from "@/lib/db/match-events"
import { addManyToLineup, addToLineup, checkEligibility, getLineup, regularsEligible, removeFromLineup } from "@/lib/db/lineups"
import { createServiceClient } from "@/lib/supabase/admin"
import { getLeagueSettings } from "@/lib/db/settings"
import { todayIso } from "@/lib/scope"

// Live sheet (planilla): the assigned referee or staff. Each action is saved
// right away and the DB recomputes score, scorers and cards.

const EVENT_TYPES: MatchEvent["type"][] = ["goal", "own_goal", "yellow", "red", "blue"]
const CARDS: MatchEvent["type"][] = ["yellow", "red", "blue"]
/** Red or blue: the player leaves the match */
const sentOff = (e: MatchEvent) => e.type === "red" || e.type === "blue"

function refresh(matchId: string) {
  // Public pages show the live score
  revalidatePath("/", "layout")
  revalidatePath(`/arbitro/partido/${matchId}`)
}

export async function addEventAction(
  matchId: string,
  input: { teamId: string; playerId: string | null; assistPlayerId?: string | null; type: MatchEvent["type"] }
): Promise<{ error?: string; notice?: string }> {
  const auth = await requireMatchEditor(matchId)
  if (auth.error) return { error: auth.error }

  if (!EVENT_TYPES.includes(input.type)) return { error: "Dato inválido." }
  if (input.type === "blue" && !(await getLeagueSettings()).blueCardsEnabled) {
    return { error: "La liga no usa tarjeta azul." }
  }
  const { data: match } = await getMatch(matchId)
  if (!match) return { error: "El partido no existe." }
  if (input.teamId !== match.homeTeamId && input.teamId !== match.awayTeamId) {
    return { error: "Ese equipo no juega este partido." }
  }
  if (match.status === "cancelled" || match.status === "postponed") {
    return { error: "El partido está suspendido o cancelado." }
  }
  // Cards need a player; a goal can be "sin identificar"
  if (CARDS.includes(input.type) && !input.playerId) {
    return { error: "Elegí el jugador." }
  }
  // Second yellow of the match: it comes with the red
  let secondYellow = false
  if (input.playerId) {
    // A player sent off (red or blue) is off the pitch: no more cards or goals
    const events = await getMatchEvents(matchId)
    const own = events.filter((e) => e.playerId === input.playerId)
    if (own.some(sentOff)) return { error: "Ese jugador ya salió del partido (tiene roja o azul)." }
    secondYellow = input.type === "yellow" && own.some((e) => e.type === "yellow")
    if (input.assistPlayerId && events.some((e) => e.playerId === input.assistPlayerId && sentOff(e))) {
      return { error: "El que asiste ya salió del partido." }
    }
    const { data: player } = await getPlayer(input.playerId)
    if (!player || player.teamId !== input.teamId) return { error: "El jugador no es de ese equipo." }
    // Whoever scores or gets a card played: put them on the lineup (if allowed to play)
    const joined = await ensureInLineup(match, input.teamId, player)
    if (joined.error) return { error: joined.error }
  }

  // An assist is a teammate of the scorer, on a regular goal
  const assistPlayerId = input.type === "goal" && input.playerId ? input.assistPlayerId ?? null : null
  if (assistPlayerId) {
    if (assistPlayerId === input.playerId) return { error: "El que asiste no puede ser el mismo que hizo el gol." }
    const { data: assist } = await getPlayer(assistPlayerId)
    if (!assist || assist.teamId !== input.teamId) return { error: "El que asiste no es de ese equipo." }
    const joined = await ensureInLineup(match, input.teamId, assist)
    if (joined.error) return { error: joined.error }
  }

  const period = match.livePeriod === "2T" ? "2T" : match.livePeriod === "1T" ? "1T" : null
  const result = await addMatchEvent({ matchId, teamId: input.teamId, playerId: input.playerId, assistPlayerId, type: input.type, period })
  if (result.error) return { error: result.error }
  if (secondYellow) {
    const red = await addMatchEvent({ matchId, teamId: input.teamId, playerId: input.playerId, assistPlayerId: null, type: "red", period })
    if (red.error) return { error: red.error }
  }

  // First event of a match being played today: it's live. Loaded afterwards
  // (referee with a watch), it stays as is until they close it.
  if (match.status === "scheduled" && match.date === todayIso()) await setMatchLiveState(matchId, "ongoing", "1T")

  refresh(matchId)
  return secondYellow ? { notice: "Segunda amarilla: se le cargó también la roja." } : {}
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

// ---------------------------------------------------------------------------
// Lineup (who played): the referee checks IDs against the list and marks them
// ---------------------------------------------------------------------------

async function ensureInLineup(match: Match, teamId: string, player: Player): Promise<{ error?: string }> {
  const lineup = await getLineup(match.id)
  if (lineup.some((l) => l.playerId === player.id)) return {}
  const eligible = await checkEligibility(match, teamId, player)
  if (eligible.error) return { error: eligible.error }
  return addToLineup(match.id, { playerId: player.id, teamId, isGuest: !!eligible.isGuest })
}

async function editableMatch(matchId: string, teamId: string): Promise<{ match?: Match; error?: string }> {
  const auth = await requireMatchEditor(matchId)
  if (auth.error) return { error: auth.error }
  const { data: match } = await getMatch(matchId)
  if (!match) return { error: "El partido no existe." }
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) return { error: "Ese equipo no juega este partido." }
  if (match.status === "cancelled" || match.status === "postponed") return { error: "El partido está suspendido o cancelado." }
  return { match }
}

/** Mark or unmark a player as playing the match. */
export async function setLineupAction(
  matchId: string,
  teamId: string,
  playerId: string,
  played: boolean
): Promise<{ error?: string }> {
  const { match, error } = await editableMatch(matchId, teamId)
  if (!match) return { error }

  if (played) {
    const { data: player } = await getPlayer(playerId)
    if (!player) return { error: "El jugador no existe." }
    const result = await ensureInLineup(match, teamId, player)
    if (result.error) return result
  } else {
    const events = await getMatchEvents(matchId)
    if (events.some((e) => e.playerId === playerId || e.assistPlayerId === playerId)) {
      return { error: "Tiene goles o tarjetas cargados en este partido: borralos primero." }
    }
    const result = await removeFromLineup(matchId, playerId)
    if (result.error) return result
  }
  refresh(matchId)
  return {}
}

/**
 * "Marcar todos": the whole list (or the active squad) plays, except the
 * suspended ones; "desmarcar todos" leaves out those with goals or cards.
 */
export async function setLineupAllAction(
  matchId: string,
  teamId: string,
  played: boolean
): Promise<{ error?: string; notice?: string }> {
  const { match, error } = await editableMatch(matchId, teamId)
  if (!match) return { error }

  if (played) {
    const { data: players } = await getPlayersByTeam(teamId)
    const lineup = await getLineup(matchId)
    const marked = new Set(lineup.map((l) => l.playerId))
    const candidates = (players ?? []).filter((p) => !marked.has(p.id))
    const result = await regularsEligible(match, teamId, candidates)
    if (result.error) return { error: result.error }
    const saved = await addManyToLineup(matchId, teamId, result.eligible.map((p) => p.id))
    if (saved.error) return saved
    refresh(matchId)
    return result.skipped.length
      ? { notice: `No se marcaron: ${result.skipped.map((s) => `${s.player.name} (${s.reason})`).join(", ")}.` }
      : {}
  }

  const [lineup, events] = await Promise.all([getLineup(matchId), getMatchEvents(matchId)])
  const withEvents = new Set(events.flatMap((e) => [e.playerId, e.assistPlayerId]).filter(Boolean))
  const toRemove = lineup.filter((l) => l.teamId === teamId && !withEvents.has(l.playerId))
  for (const l of toRemove) {
    const result = await removeFromLineup(matchId, l.playerId)
    if (result.error) return result
  }
  refresh(matchId)
  const kept = lineup.filter((l) => l.teamId === teamId && withEvents.has(l.playerId)).length
  return kept ? { notice: `Quedaron marcados ${kept} con goles o tarjetas cargados.` } : {}
}

/**
 * Refuerzo that isn't in the system yet: the referee creates them with name and
 * number. They join the team as inactive (not part of the squad) and play this match.
 */
export async function addNewGuestAction(
  matchId: string,
  teamId: string,
  input: { name: string; number: number }
): Promise<{ error?: string }> {
  const { match, error } = await editableMatch(matchId, teamId)
  if (!match) return { error }

  const name = input.name.trim()
  if (name.length < 3) return { error: "Escribí nombre y apellido." }
  if (name.length > 80) return { error: "El nombre es demasiado largo." }
  const number = Number.isFinite(input.number) && input.number > 0 && input.number < 100 ? Math.trunc(input.number) : 0

  // Referees can't create players through RLS: checked above, created with the service role
  const admin = createServiceClient()
  const { data: created, error: insertError } = await admin
    .from("players")
    .insert({ name, number, position: "mediocampista", team_id: teamId, active: false })
    .select("id")
    .single()
  if (insertError || !created) return { error: "No se pudo crear el jugador." }

  const { data: player } = await getPlayer(created.id)
  if (!player) return { error: "No se pudo crear el jugador." }
  const eligible = await checkEligibility(match, teamId, player)
  if (eligible.error) {
    await admin.from("players").delete().eq("id", created.id)
    return { error: eligible.error }
  }
  const result = await addToLineup(matchId, { playerId: player.id, teamId, isGuest: !!eligible.isGuest })
  if (result.error) {
    // Don't leave a player behind that never played
    await admin.from("players").delete().eq("id", created.id)
    return result
  }
  refresh(matchId)
  return {}
}
