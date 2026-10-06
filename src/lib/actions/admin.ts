"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createTournament,
  updateTournament,
  deleteTournament,
} from "@/lib/db/tournaments"
import {
  createSeries,
  updateSeries,
  deleteSeries,
  createDivision,
  updateDivision,
  deleteDivision,
  getDivision,
} from "@/lib/db/series"
import { assignDelegate } from "@/lib/db/delegates"
import { saveMatchGoals } from "@/lib/db/goals"
import {
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from "@/lib/db/sponsors"
import {
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/lib/db/teams"
import {
  getPlayersByTeam,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/lib/db/players"
import {
  getMatch,
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/lib/db/matches"
import {
  createSanction,
  getSanction,
  deleteSanction,
  syncMatchRedCards,
} from "@/lib/db/sanctions"
import {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
} from "@/lib/db/news"
import { bulkCreateMatches } from "@/lib/db/fixture-actions"
import {
  getRegistrations,
  createRegistration,
  deleteRegistration,
  withdrawRegistration,
  setRoster,
} from "@/lib/db/registrations"
import { uploadOptionalImage } from "@/lib/actions/upload"
import { updateLeagueSettings } from "@/lib/db/settings"
import { createClient } from "@/lib/supabase/server"
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPhotos,
  deletePhoto,
  getAlbum,
  getPhotos,
  storagePathFromUrl,
  type AlbumInput,
} from "@/lib/db/gallery"
import { requireStaff } from "@/lib/auth"
import type { Player, Match } from "@/lib/types"

/**
 * Public pages (home, actualidad, goleadores…) are statically rendered, so any
 * change made from the panels must invalidate the whole site, not just /admin.
 */
function revalidateSite() {
  revalidatePath("/", "layout")
}

/**
 * Reads seriesId/divisionId from a form. The division decides the series, so
 * a tournament can never end up in a division of another series.
 */
async function readSeriesDivision(
  formData: FormData
): Promise<{ seriesId: string | null; divisionId: string | null; error?: string }> {
  const divisionId = (formData.get("divisionId") as string | null) || null
  if (divisionId) {
    const { data: division } = await getDivision(divisionId)
    if (!division) return { seriesId: null, divisionId: null, error: "La división elegida no existe." }
    return { seriesId: division.seriesId, divisionId }
  }
  return { seriesId: (formData.get("seriesId") as string | null) || null, divisionId: null }
}

// ---------------------------------------------------------------------------
// Tournament actions
// ---------------------------------------------------------------------------

export async function createTournamentAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const season = formData.get("season") as string
  const format = formData.get("format") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string

  if (!name?.trim()) return { error: "El nombre del torneo es obligatorio." }
  if (!season?.trim()) return { error: "La temporada es obligatoria." }
  if (!format) return { error: "El formato es obligatorio." }

  const scope = await readSeriesDivision(formData)
  if (scope.error) return { error: scope.error }
  if (!scope.divisionId) return { error: "Elegí la serie y la división del torneo." }

  const result = await createTournament({
    name: name.trim(),
    category: category?.trim() || undefined,
    seriesId: scope.seriesId,
    divisionId: scope.divisionId,
    season: season.trim(),
    format: format as "league" | "elimination" | "groups",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateTournamentAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const season = formData.get("season") as string
  const format = formData.get("format") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string

  if (!name?.trim()) return { error: "El nombre del torneo es obligatorio." }

  const scope = await readSeriesDivision(formData)
  if (scope.error) return { error: scope.error }
  if (!scope.divisionId) return { error: "Elegí la serie y la división del torneo." }

  const result = await updateTournament(id, {
    name: name.trim(),
    category: category?.trim() || undefined,
    seriesId: scope.seriesId,
    divisionId: scope.divisionId,
    season: season?.trim() || undefined,
    format: (format as "league" | "elimination" | "groups") || undefined,
    startDate: startDate || null,
    endDate: endDate || null,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteTournamentAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteTournament(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Team actions
// ---------------------------------------------------------------------------

export async function createTeamAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const shortName = formData.get("shortName") as string
  const category = formData.get("category") as string
  const coach = formData.get("coach") as string
  const assistantCoach = formData.get("assistantCoach") as string
  const tournamentId = formData.get("tournamentId") as string

  if (!name?.trim()) return { error: "El nombre del equipo es obligatorio." }
  if (!shortName?.trim()) return { error: "El nombre corto es obligatorio." }

  const { url: shieldUrl, error: uploadError } = await uploadOptionalImage(formData, "shield", "teams")
  if (uploadError) return { error: uploadError }

  const result = await createTeam({
    name: name.trim(),
    shortName: shortName.trim(),
    category: category?.trim() || undefined,
    coach: coach?.trim() || undefined,
    assistantCoach: assistantCoach?.trim() || undefined,
    tournamentId: tournamentId || undefined,
    shieldUrl,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateTeamAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const shortName = formData.get("shortName") as string
  const category = formData.get("category") as string
  const coach = formData.get("coach") as string
  const assistantCoach = formData.get("assistantCoach") as string
  const tournamentId = formData.get("tournamentId") as string | null

  if (!name?.trim()) return { error: "El nombre del equipo es obligatorio." }

  const { url: shieldUrl, error: uploadError } = await uploadOptionalImage(formData, "shield", "teams")
  if (uploadError) return { error: uploadError }

  const result = await updateTeam(id, {
    name: name.trim(),
    shortName: shortName?.trim() || undefined,
    category: category?.trim() || undefined,
    coach: coach?.trim() || null,
    assistantCoach: assistantCoach?.trim() || null,
    // Only touch the tournament when the form sends it (editing used to clear it)
    tournamentId: tournamentId === null ? undefined : tournamentId || null,
    shieldUrl: shieldUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteTeamAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteTeam(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  redirect("/admin/equipos")
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export async function createPlayerAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const number = formData.get("number") as string
  const position = formData.get("position") as string
  const teamId = formData.get("teamId") as string

  if (!name?.trim()) return { error: "El nombre del jugador es obligatorio." }
  if (!teamId) return { error: "El equipo es obligatorio." }

  const { url: photoUrl, error: uploadError } = await uploadOptionalImage(formData, "photo", "players")
  if (uploadError) return { error: uploadError }

  const result = await createPlayer({
    name: name.trim(),
    number: number ? parseInt(number, 10) : 0,
    position: (position as Player["position"]) ?? "delantero",
    teamId,
    photo: photoUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updatePlayerAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const number = formData.get("number") as string
  const position = formData.get("position") as string
  const teamId = formData.get("teamId") as string
  const active = formData.get("active") as string | null

  if (!name?.trim()) return { error: "El nombre del jugador es obligatorio." }

  const { url: photoUrl, error: uploadError } = await uploadOptionalImage(formData, "photo", "players")
  if (uploadError) return { error: uploadError }

  const result = await updatePlayer(id, {
    name: name.trim(),
    number: number ? parseInt(number, 10) : undefined,
    position: (position as Player["position"]) || undefined,
    teamId: teamId || undefined,
    active: active === null ? undefined : active === "true",
    photo: photoUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deletePlayerAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deletePlayer(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Match actions
// ---------------------------------------------------------------------------

export async function createMatchAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const tournamentId = formData.get("tournamentId") as string
  const homeTeamId = formData.get("homeTeamId") as string
  const awayTeamId = formData.get("awayTeamId") as string
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const matchday = formData.get("matchday") as string
  const venue = formData.get("venue") as string

  if (!tournamentId) return { error: "El torneo es obligatorio." }
  if (!homeTeamId) return { error: "El equipo local es obligatorio." }
  if (!awayTeamId) return { error: "El equipo visitante es obligatorio." }
  if (!date) return { error: "La fecha es obligatoria." }
  if (!time) return { error: "El horario es obligatorio." }
  if (!matchday) return { error: "La jornada es obligatoria." }
  if (homeTeamId === awayTeamId)
    return { error: "El equipo local y visitante no pueden ser el mismo." }

  const { data: registrations } = await getRegistrations({ tournamentId })
  const registered = new Set((registrations ?? []).filter((r) => !r.withdrawnAt).map((r) => r.teamId))
  if (!registered.has(homeTeamId) || !registered.has(awayTeamId)) {
    return { error: "Los dos equipos tienen que estar inscriptos en el torneo." }
  }

  const result = await createMatch({
    tournamentId,
    homeTeamId,
    awayTeamId,
    date,
    time,
    matchday: parseInt(matchday, 10),
    venue: venue || undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

const MATCH_STATUSES: Match["status"][] = ["scheduled", "ongoing", "finished", "postponed", "cancelled"]
const WALKOVER_SCORE = 3

export async function updateMatchAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const { data: match } = await getMatch(id)
  if (!match) return { error: "El partido no existe." }

  const homeScore = formData.get("homeScore") as string | null
  const awayScore = formData.get("awayScore") as string | null
  const statusValue = formData.get("status") as string | null
  const result = (formData.get("result") as string | null) ?? "normal" // normal | wo_home | wo_away
  const homeTeamId = (formData.get("homeTeamId") as string | null) || match.homeTeamId
  const awayTeamId = (formData.get("awayTeamId") as string | null) || match.awayTeamId
  const date = formData.get("date") as string | null
  const time = formData.get("time") as string | null
  const matchday = formData.get("matchday") as string | null
  const venue = formData.get("venue") as string | null
  const notes = formData.get("notes") as string | null
  const refereeId = formData.get("refereeId") as string | null

  const status = MATCH_STATUSES.find((s) => s === statusValue) ?? match.status

  // Changing who plays (e.g. a rescheduled or swapped match)
  if (homeTeamId !== match.homeTeamId || awayTeamId !== match.awayTeamId) {
    if (homeTeamId === awayTeamId) return { error: "El equipo local y visitante no pueden ser el mismo." }
    const { data: registrations } = await getRegistrations({ tournamentId: match.tournamentId })
    const registered = new Set((registrations ?? []).filter((r) => !r.withdrawnAt).map((r) => r.teamId))
    if (!registered.has(homeTeamId) || !registered.has(awayTeamId)) {
      return { error: "Los dos equipos tienen que estar inscriptos en el torneo." }
    }
  }

  const walkover = result === "wo_home" || result === "wo_away"
  const payload: Parameters<typeof updateMatch>[1] = {
    homeTeamId,
    awayTeamId,
    status: walkover ? "finished" : status,
    walkover,
    date: date || undefined,
    time: time || undefined,
    matchday: matchday ? parseInt(matchday, 10) : undefined,
    venue: venue?.trim() || null,
    notes: notes?.trim() || null,
    // "none" = sin árbitro; field absent = don't touch
    refereeId: refereeId === null ? undefined : refereeId === "none" ? null : refereeId,
  }

  if (walkover) {
    // W.O. is always 3-0 for the team that showed up
    payload.homeScore = result === "wo_home" ? WALKOVER_SCORE : 0
    payload.awayScore = result === "wo_away" ? WALKOVER_SCORE : 0
  } else if (status === "postponed" || status === "cancelled") {
    payload.homeScore = null
    payload.awayScore = null
  } else {
    if (homeScore) payload.homeScore = parseInt(homeScore, 10)
    if (awayScore) payload.awayScore = parseInt(awayScore, 10)
    if (status === "finished" && (payload.homeScore == null && match.homeScore == null)) {
      return { error: "Cargá el resultado para dar el partido por finalizado." }
    }
  }

  // Scorers from the form, merged by player; checked against the score
  let goals: { playerId: string; goals: number }[] | null = null
  if (!walkover && formData.has("goalPlayer")) {
    const goalPlayers = formData.getAll("goalPlayer") as string[]
    const goalCounts = formData.getAll("goalCount") as string[]
    const byPlayer = new Map<string, number>()
    goalPlayers.forEach((pid, i) => {
      const count = parseInt(goalCounts[i] || "0", 10)
      if (pid && pid !== "none" && count > 0) byPlayer.set(pid, (byPlayer.get(pid) ?? 0) + count)
    })
    const list = [...byPlayer].map(([playerId, count]) => ({ playerId, goals: count }))
    goals = list

    if (list.length > 0) {
      const [{ data: homePlayers }, { data: awayPlayers }] = await Promise.all([
        getPlayersByTeam(homeTeamId),
        getPlayersByTeam(awayTeamId),
      ])
      const homeIds = new Set((homePlayers ?? []).map((p) => p.id))
      const awayIds = new Set((awayPlayers ?? []).map((p) => p.id))
      const sum = (ids: Set<string>) => list.filter((g) => ids.has(g.playerId)).reduce((a, g) => a + g.goals, 0)
      const homeScoreFinal = payload.homeScore ?? match.homeScore ?? 0
      const awayScoreFinal = payload.awayScore ?? match.awayScore ?? 0
      if (list.some((g) => !homeIds.has(g.playerId) && !awayIds.has(g.playerId))) {
        return { error: "Hay goleadores que no son de ninguno de los dos equipos." }
      }
      // Fewer is allowed (own goals); more is a typo
      if (sum(homeIds) > homeScoreFinal || sum(awayIds) > awayScoreFinal) {
        return { error: "Los goles cargados por jugador superan el resultado del partido." }
      }
    }
  }

  const update = await updateMatch(id, payload)
  if (update.error) return { error: update.error }

  // Red cards: the form's selection is the source of truth (no duplicates)
  if (formData.has("redCardsField")) {
    const redCards = (formData.getAll("redCards") as string[]).filter((p) => p && p !== "none")
    const sync = await syncMatchRedCards(id, redCards)
    if (sync.error) return { error: sync.error }
  }

  // Scorers: replace what was saved (so they can also be removed)
  const scorers = walkover ? [] : (goals ?? [])
  if (walkover || goals) {
    const saved = await saveMatchGoals(id, scorers)
    if (saved.error) return { error: saved.error }
  }

  revalidateSite()
  return { success: true as const }
}

export async function deleteMatchAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteMatch(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Fixture actions
// ---------------------------------------------------------------------------

export async function generateFixtureAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const tournamentId = formData.get("tournamentId") as string
  const teamIdsJson = formData.get("teamIds") as string

  if (!tournamentId) return { error: "Falta el ID del torneo." }
  if (!teamIdsJson) return { error: "Faltan los IDs de los equipos." }

  let teamIds: string[]
  try {
    teamIds = JSON.parse(teamIdsJson)
  } catch {
    return { error: "Formato inválido de IDs de equipos." }
  }

  if (teamIds.length < 2) return { error: "Se necesitan al menos 2 equipos." }

  // The preview's order is kept, but the teams must be exactly the registered ones
  const { data: registrations } = await getRegistrations({ tournamentId })
  const registered = new Set((registrations ?? []).filter((r) => !r.withdrawnAt).map((r) => r.teamId))
  if (teamIds.length !== registered.size || teamIds.some((id) => !registered.has(id))) {
    return { error: "Los equipos cambiaron. Cerrá y volvé a generar la vista previa." }
  }

  const { data: existing } = await getMatches(tournamentId)
  if ((existing ?? []).length > 0) {
    return { error: "Este torneo ya tiene partidos cargados. Borralos antes de generar el fixture de nuevo." }
  }

  const result = await bulkCreateMatches(tournamentId, teamIds, {
    doubleRound: formData.get("doubleRound") === "true",
  })
  if (result.error) return { error: result.error }

  revalidateSite()
  return { success: true as const }
}

// ---------------------------------------------------------------------------
// Sanction actions
// ---------------------------------------------------------------------------

export async function createSanctionAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const playerId = formData.get("playerId") as string
  const matchId = formData.get("matchId") as string | null
  const cardType = formData.get("cardType") as string
  const matchDate = formData.get("matchDate") as string
  const matchesSuspended = formData.get("matchesSuspended") as string

  if (!playerId) return { error: "El jugador es obligatorio." }
  if (!cardType) return { error: "El tipo de tarjeta es obligatorio." }
  if (!matchId) return { error: "Elegí el partido de la sanción." }

  const { data: match } = await getMatch(matchId)
  if (!match) return { error: "El partido no existe." }

  const result = await createSanction({
    playerId,
    matchId: matchId || undefined,
    cardType: cardType as "yellow" | "red",
    matchDate: matchDate || match.date,
    matchesSuspended: cardType === "yellow" ? 0 : matchesSuspended ? parseInt(matchesSuspended, 10) : 1,
  })

  if (result.error) return { error: result.error }
  if (cardType === "yellow") await recomputeAccumulationFor(playerId, matchId)
  revalidateSite()
  return { success: true as const }
}

export async function deleteSanctionAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const { data: sanction } = await getSanction(id)
  const result = await deleteSanction(id)
  if (result.error) return { error: result.error }
  if (sanction?.cardType === "yellow") await recomputeAccumulationFor(sanction.playerId, sanction.matchId)
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// News actions
// ---------------------------------------------------------------------------

export async function createArticleAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const title = formData.get("title") as string
  const excerpt = formData.get("excerpt") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const seriesId = formData.get("seriesId") as string
  const published = formData.get("published") as string

  if (!title?.trim()) return { error: "El título es obligatorio." }

  const { url: imageUrl, error: uploadError } = await uploadOptionalImage(formData, "image", "news")
  if (uploadError) return { error: uploadError }

  const result = await createArticle({
    title: title.trim(),
    excerpt: excerpt?.trim() || null,
    content: content?.trim() || null,
    category: category?.trim() || null,
    seriesId: seriesId && seriesId !== "null" ? seriesId : null,
    imageUrl,
    published: published === "true",
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateArticleAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const title = formData.get("title") as string
  const excerpt = formData.get("excerpt") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const seriesId = formData.get("seriesId") as string
  const published = formData.get("published") as string

  const { url: imageUrl, error: uploadError } = await uploadOptionalImage(formData, "image", "news")
  if (uploadError) return { error: uploadError }

  const result = await updateArticle(id, {
    title: title?.trim() || undefined,
    excerpt: excerpt?.trim() || null,
    content: content?.trim() || null,
    category: category?.trim() || null,
    seriesId: seriesId && seriesId !== "null" ? seriesId : null,
    imageUrl: imageUrl ?? undefined,
    published: published === "true",
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteArticleAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteArticle(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

export async function publishArticleAction(id: string) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await publishArticle(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function unpublishArticleAction(id: string) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await unpublishArticle(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

/** Form action wrapper for publish — accepts FormData, returns void */
export async function publishArticleFormAction(formData: FormData) {
  if ((await requireStaff()).error) return

  const id = formData.get("id") as string
  if (!id) return
  await publishArticle(id)
  revalidateSite()
}

/** Form action wrapper for unpublish — accepts FormData, returns void */
export async function unpublishArticleFormAction(formData: FormData) {
  if ((await requireStaff()).error) return

  const id = formData.get("id") as string
  if (!id) return
  await unpublishArticle(id)
  revalidateSite()
}

// ---------------------------------------------------------------------------
// Series actions
// ---------------------------------------------------------------------------

export async function createSeriesAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name?.trim()) return { error: "El nombre de la serie es obligatorio." }

  const result = await createSeries({
    name: name.trim(),
    description: description?.trim() || undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateSeriesAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const result = await updateSeries(id, {
    name: name?.trim() || undefined,
    description: description?.trim() || null,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteSeriesAction(
  id: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteSeries(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Division actions
// ---------------------------------------------------------------------------

export async function createDivisionAction(
  seriesId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string

  if (!name?.trim()) return { error: "El nombre de la división es obligatorio." }

  const result = await createDivision({
    seriesId,
    name: name.trim(),
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateDivisionAction(
  id: string,
  seriesId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const displayOrder = formData.get("displayOrder") as string

  const result = await updateDivision(id, {
    name: name?.trim() || undefined,
    displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteDivisionAction(
  id: string,
  seriesId: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteDivision(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Delegate actions
// ---------------------------------------------------------------------------

export async function assignDelegateAction(
  teamId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const email = formData.get("email") as string
  if (!email?.trim()) return { error: "El email es obligatorio." }

  const result = await assignDelegate(teamId, email.trim())
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

// ---------------------------------------------------------------------------
// Matchday suspension
// ---------------------------------------------------------------------------

/**
 * Suspends one matchday of one tournament.
 * - days > 0: every pending match from that matchday on moves the same number
 *   of days (the whole calendar shifts, e.g. one week).
 * - days = 0: the matchday's pending matches are marked "suspendido" to be
 *   rescheduled later; the rest of the calendar stays.
 */
export async function suspendMatchdayAction(
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const tournamentId = formData.get("tournamentId") as string | null
  const matchday = parseInt((formData.get("matchday") as string | null) ?? "", 10)
  const days = parseInt((formData.get("days") as string | null) || "0", 10)
  const reason = (formData.get("reason") as string | null)?.trim() || null

  if (!tournamentId) return { error: "Elegí el torneo." }
  if (!matchday || matchday < 1) return { error: "Indicá el número de fecha." }
  if (Number.isNaN(days) || days < 0) return { error: "Los días a correr no pueden ser negativos." }

  const { data: matches } = await getMatches(tournamentId)
  const pending = (matches ?? []).filter(
    (m) => m.status === "scheduled" || m.status === "postponed"
  )
  const affected = days > 0
    ? pending.filter((m) => m.matchday >= matchday)
    : pending.filter((m) => m.matchday === matchday)

  if (affected.length === 0) return { error: "No hay partidos pendientes en esa fecha." }

  for (const m of affected) {
    const result = days > 0
      ? await updateMatch(m.id, {
          status: "scheduled",
          date: m.date ? shiftDate(m.date, days) : undefined,
          notes: m.matchday === matchday ? reason : undefined,
        })
      : await updateMatch(m.id, { status: "postponed", notes: reason })
    if (result.error) return { error: result.error }
  }

  revalidateSite()
  return { success: true as const }
}

/** "2026-08-15" + 7 → "2026-08-22" (UTC, no timezone drift) */
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Sponsor actions
// ---------------------------------------------------------------------------

export async function createSponsorAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const logoUrl = formData.get("logoUrl") as string
  const linkUrl = formData.get("linkUrl") as string
  const displayOrder = formData.get("displayOrder") as string

  if (!name?.trim()) return { error: "El nombre es obligatorio." }

  // An uploaded file wins over a pasted URL (the upload used to be ignored)
  const { url: uploadedLogo, error: uploadError } = await uploadOptionalImage(formData, "logo", "sponsors")
  if (uploadError) return { error: uploadError }
  const logo = uploadedLogo ?? logoUrl?.trim()
  if (!logo) return { error: "Subí el logo o pegá su URL." }

  const result = await createSponsor({
    name: name.trim(),
    logoUrl: logo,
    linkUrl: linkUrl?.trim() || undefined,
    displayOrder: displayOrder ? parseInt(displayOrder) : 0,
  })
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function updateSponsorAction(id: string, _prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const logoUrl = formData.get("logoUrl") as string
  const linkUrl = formData.get("linkUrl") as string
  const displayOrder = formData.get("displayOrder") as string

  const { url: uploadedLogo, error: uploadError } = await uploadOptionalImage(formData, "logo", "sponsors")
  if (uploadError) return { error: uploadError }

  const result = await updateSponsor(id, {
    name: name?.trim() || undefined,
    logoUrl: uploadedLogo ?? (logoUrl?.trim() || undefined),
    linkUrl: linkUrl?.trim() || null,
    displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
  })
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteSponsorAction(id: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteSponsor(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// Registration (inscripción) actions
// ---------------------------------------------------------------------------

export async function registerTeamAction(
  tournamentId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const teamId = formData.get("teamId") as string | null
  if (!teamId) return { error: "Elegí un equipo." }

  const result = await createRegistration(tournamentId, teamId)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function unregisterTeamAction(
  registrationId: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteRegistration(registrationId)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

/** Team leaves the tournament: played matches stay, pending ones become W.O. 3-0. */
export async function withdrawTeamAction(
  registrationId: string
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await withdrawRegistration(registrationId)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

/** Lista de buena fe: the checked players (playerIds) replace the current list. */
export async function setRosterAction(
  registrationId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const playerIds = formData.getAll("playerIds").filter((v): v is string => typeof v === "string")
  const result = await setRoster(registrationId, playerIds)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

// ---------------------------------------------------------------------------
// Gallery actions
// ---------------------------------------------------------------------------

function readAlbumForm(formData: FormData): AlbumInput | { error: string } {
  const title = (formData.get("title") as string | null)?.trim()
  if (!title) return { error: "El título del álbum es obligatorio." }
  const optional = (name: string) => {
    const value = (formData.get(name) as string | null)?.trim()
    return value && value !== "null" ? value : null
  }
  return {
    title,
    description: optional("description"),
    date: optional("date"),
    seriesId: optional("seriesId"),
    matchId: optional("matchId"),
    published: formData.get("published") === "true",
  }
}

export async function createAlbumAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const input = readAlbumForm(formData)
  if ("error" in input) return { error: input.error }

  const result = await createAlbum(input)
  if (result.error || !result.id) return { error: result.error ?? "No se pudo crear el álbum." }
  revalidateSite()
  redirect(`/admin/galeria/${result.id}`)
}

export async function updateAlbumAction(id: string, _prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const input = readAlbumForm(formData)
  if ("error" in input) return { error: input.error }

  const result = await updateAlbum(id, input)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function deleteAlbumAction(id: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deleteAlbum(id)
  if (result.error) return { error: result.error }
  revalidateSite()
  redirect("/admin/galeria")
}

/**
 * The browser uploads the files straight to Storage (no body-size limit),
 * then sends the public URLs here. Only URLs inside this album's folder are accepted.
 */
export async function addPhotosAction(
  albumId: string,
  photos: { url: string; thumbUrl: string | null }[]
): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const inAlbum = (url: string | null) => !url || storagePathFromUrl(url)?.startsWith(`gallery/${albumId}/`)
  if (!photos.every((p) => inAlbum(p.url) && inAlbum(p.thumbUrl))) {
    return { error: "Alguna foto no pertenece a este álbum." }
  }

  const { data: album } = await getAlbum(albumId, true)
  if (!album) return { error: "El álbum no existe." }

  const result = await addPhotos(albumId, photos)
  if (result.error) return { error: result.error }
  // The cover is shown in cards: the thumbnail is enough
  const first = photos[0]
  if (!album.coverUrl && first) await updateAlbum(albumId, { coverUrl: first.thumbUrl ?? first.url })

  revalidateSite()
  return {}
}

export async function deletePhotoAction(photoId: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await deletePhoto(photoId)
  if (result.error || !result.albumId) return { error: result.error }

  // Deleted the cover: use the next photo (or none)
  const { data: album } = await getAlbum(result.albumId, true)
  if (album?.coverUrl && result.urls?.includes(album.coverUrl)) {
    const { data: photos } = await getPhotos(result.albumId, true)
    const next = photos?.[0]
    await updateAlbum(result.albumId, { coverUrl: next ? next.thumbUrl ?? next.url : null })
  }

  revalidateSite()
  return {}
}

export async function setAlbumCoverAction(albumId: string, url: string): Promise<{ error?: string }> {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const result = await updateAlbum(albumId, { coverUrl: url })
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

// ---------------------------------------------------------------------------
// League settings and referees
// ---------------------------------------------------------------------------

export async function updateSettingsAction(_prev: unknown, formData: FormData) {
  const auth = await requireStaff()
  if (auth.error) return { error: auth.error }

  const num = (name: string) => parseInt((formData.get(name) as string | null) ?? "", 10)
  const settings = {
    yellowCardsForSuspension: num("yellowCardsForSuspension"),
    yellowSuspensionMatches: num("yellowSuspensionMatches"),
    redCardMatches: num("redCardMatches"),
  }
  if (Object.values(settings).some((v) => Number.isNaN(v) || v < 0 || v > 50)) {
    return { error: "Revisá los números: tienen que ser entre 0 y 50." }
  }

  const result = await updateLeagueSettings(settings)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

/** After adding/removing a yellow by hand: rebuild that player's accumulation. */
async function recomputeAccumulationFor(playerId: string, matchId: string | null) {
  if (!matchId) return
  const { data: match } = await getMatch(matchId)
  if (!match) return
  const supabase = await createClient()
  await supabase.rpc("recompute_accumulation", { p_player_id: playerId, p_tournament_id: match.tournamentId })
}
