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
} from "@/lib/db/series"
import {
  assignDelegate,
  revokeDelegate,
} from "@/lib/db/delegates"
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
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/lib/db/players"
import {
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/lib/db/matches"
import {
  createSanction,
  deleteSanction,
} from "@/lib/db/sanctions"
import {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
} from "@/lib/db/news"
import { bulkCreateMatches } from "@/lib/db/fixture-actions"
import { uploadOptionalImage } from "@/lib/actions/upload"
import type { Player, Match } from "@/lib/types"

// ---------------------------------------------------------------------------
// Tournament actions
// ---------------------------------------------------------------------------

export async function createTournamentAction(
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const season = formData.get("season") as string
  const format = formData.get("format") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string

  if (!name?.trim()) return { error: "El nombre del torneo es obligatorio." }
  if (!category?.trim()) return { error: "La categoría es obligatoria." }
  if (!season?.trim()) return { error: "La temporada es obligatoria." }
  if (!format) return { error: "El formato es obligatorio." }

  const result = await createTournament({
    name: name.trim(),
    category: category.trim(),
    season: season.trim(),
    format: format as "league" | "elimination" | "groups",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/torneos")
  return { success: true as const }
}

export async function updateTournamentAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const season = formData.get("season") as string
  const format = formData.get("format") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string

  if (!name?.trim()) return { error: "El nombre del torneo es obligatorio." }

  const result = await updateTournament(id, {
    name: name.trim(),
    category: category.trim() || undefined,
    season: season.trim() || undefined,
    format: (format as "league" | "elimination" | "groups") || undefined,
    startDate: startDate || null,
    endDate: endDate || null,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/torneos")
  return { success: true as const }
}

export async function deleteTournamentAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteTournament(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/torneos")
  return {}
}

// ---------------------------------------------------------------------------
// Team actions
// ---------------------------------------------------------------------------

export async function createTeamAction(_prev: unknown, formData: FormData) {
  const name = formData.get("name") as string
  const shortName = formData.get("shortName") as string
  const category = formData.get("category") as string
  const coach = formData.get("coach") as string
  const assistantCoach = formData.get("assistantCoach") as string
  const tournamentId = formData.get("tournamentId") as string

  if (!name?.trim()) return { error: "El nombre del equipo es obligatorio." }
  if (!shortName?.trim()) return { error: "El nombre corto es obligatorio." }
  if (!category?.trim()) return { error: "La categoría es obligatoria." }

  const { url: shieldUrl, error: uploadError } = await uploadOptionalImage(formData, "shield", "teams")
  if (uploadError) return { error: uploadError }

  const result = await createTeam({
    name: name.trim(),
    shortName: shortName.trim(),
    category: category.trim(),
    coach: coach?.trim() || undefined,
    assistantCoach: assistantCoach?.trim() || undefined,
    tournamentId: tournamentId || undefined,
    shieldUrl,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/equipos")
  return { success: true as const }
}

export async function updateTeamAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const shortName = formData.get("shortName") as string
  const category = formData.get("category") as string
  const coach = formData.get("coach") as string
  const assistantCoach = formData.get("assistantCoach") as string
  const tournamentId = formData.get("tournamentId") as string

  if (!name?.trim()) return { error: "El nombre del equipo es obligatorio." }

  const { url: shieldUrl, error: uploadError } = await uploadOptionalImage(formData, "shield", "teams")
  if (uploadError) return { error: uploadError }

  const result = await updateTeam(id, {
    name: name.trim(),
    shortName: shortName?.trim() || undefined,
    category: category?.trim() || undefined,
    coach: coach?.trim() || null,
    assistantCoach: assistantCoach?.trim() || null,
    tournamentId: tournamentId || null,
    shieldUrl: shieldUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/equipos")
  revalidatePath(`/admin/equipos/${id}`)
  return { success: true as const }
}

export async function deleteTeamAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteTeam(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/equipos")
  redirect("/admin/equipos")
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export async function createPlayerAction(_prev: unknown, formData: FormData) {
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
  revalidatePath("/admin/jugadores")
  return { success: true as const }
}

export async function updatePlayerAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const number = formData.get("number") as string
  const position = formData.get("position") as string
  const teamId = formData.get("teamId") as string
  const active = formData.get("active") as string

  if (!name?.trim()) return { error: "El nombre del jugador es obligatorio." }

  const { url: photoUrl, error: uploadError } = await uploadOptionalImage(formData, "photo", "players")
  if (uploadError) return { error: uploadError }

  const result = await updatePlayer(id, {
    name: name.trim(),
    number: number ? parseInt(number, 10) : undefined,
    position: (position as Player["position"]) || undefined,
    teamId: teamId || undefined,
    active: active === "true",
    photo: photoUrl ?? null,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/jugadores")
  return { success: true as const }
}

export async function deletePlayerAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deletePlayer(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/jugadores")
  return {}
}

// ---------------------------------------------------------------------------
// Match actions
// ---------------------------------------------------------------------------

export async function createMatchAction(
  _prev: unknown,
  formData: FormData
) {
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
  revalidatePath("/admin/partidos")
  return { success: true as const }
}

export async function updateMatchAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const homeScore = formData.get("homeScore") as string
  const awayScore = formData.get("awayScore") as string
  const status = formData.get("status") as string
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const matchday = formData.get("matchday") as string
  const venue = formData.get("venue") as string

  const payload: Partial<{
    homeScore: number | null
    awayScore: number | null
    status: Match["status"]
    date: string
    time: string
    matchday: number
    venue: string | null
  }> = {}

  if (homeScore !== null && homeScore !== undefined && homeScore !== "") {
    payload.homeScore = parseInt(homeScore, 10)
  }
  if (awayScore !== null && awayScore !== undefined && awayScore !== "") {
    payload.awayScore = parseInt(awayScore, 10)
  }
  if (status) payload.status = status as Match["status"]
  if (date) payload.date = date
  if (time) payload.time = time
  if (matchday) payload.matchday = parseInt(matchday, 10)
  payload.venue = venue || null

  const result = await updateMatch(id, payload)

  if (result.error) return { error: result.error }
  revalidatePath("/admin/partidos")
  return { success: true as const }
}

export async function deleteMatchAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteMatch(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/partidos")
  return {}
}

// ---------------------------------------------------------------------------
// Fixture actions
// ---------------------------------------------------------------------------

export async function generateFixtureAction(
  _prev: unknown,
  formData: FormData
) {
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

  const result = await bulkCreateMatches(tournamentId, teamIds)
  if (result.error) return { error: result.error }

  revalidatePath("/admin/partidos")
  revalidatePath("/admin/torneos")
  return { success: true as const }
}

// ---------------------------------------------------------------------------
// Sanction actions
// ---------------------------------------------------------------------------

export async function createSanctionAction(
  _prev: unknown,
  formData: FormData
) {
  const playerId = formData.get("playerId") as string
  const matchId = formData.get("matchId") as string | null
  const cardType = formData.get("cardType") as string
  const matchDate = formData.get("matchDate") as string
  const matchesSuspended = formData.get("matchesSuspended") as string

  if (!playerId) return { error: "El jugador es obligatorio." }
  if (!cardType) return { error: "El tipo de tarjeta es obligatorio." }
  if (!matchDate) return { error: "La fecha del partido es obligatoria." }

  const result = await createSanction({
    playerId,
    matchId: matchId || undefined,
    cardType: cardType as "yellow" | "red",
    matchDate,
    matchesSuspended: matchesSuspended ? parseInt(matchesSuspended, 10) : cardType === "red" ? 1 : 0,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/sanciones")
  return { success: true as const }
}

export async function deleteSanctionAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteSanction(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/sanciones")
  return {}
}

// ---------------------------------------------------------------------------
// News actions
// ---------------------------------------------------------------------------

export async function createArticleAction(
  _prev: unknown,
  formData: FormData
) {
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
    seriesId: seriesId || null,
    imageUrl,
    published: published === "true",
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/noticias")
  return { success: true as const }
}

export async function updateArticleAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
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
    seriesId: seriesId || null,
    imageUrl: imageUrl ?? undefined,
    published: published === "true",
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/noticias")
  return { success: true as const }
}

export async function deleteArticleAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteArticle(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/noticias")
  return {}
}

export async function publishArticleAction(id: string) {
  const result = await publishArticle(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/noticias")
  return { success: true as const }
}

export async function unpublishArticleAction(id: string) {
  const result = await unpublishArticle(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/noticias")
  return { success: true as const }
}

/** Form action wrapper for publish — accepts FormData, returns void */
export async function publishArticleFormAction(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return
  await publishArticle(id)
  revalidatePath("/admin/noticias")
}

/** Form action wrapper for unpublish — accepts FormData, returns void */
export async function unpublishArticleFormAction(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return
  await unpublishArticle(id)
  revalidatePath("/admin/noticias")
}

// ---------------------------------------------------------------------------
// Series actions
// ---------------------------------------------------------------------------

export async function createSeriesAction(
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name?.trim()) return { error: "El nombre de la serie es obligatorio." }

  const result = await createSeries({
    name: name.trim(),
    description: description?.trim() || undefined,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/series")
  return { success: true as const }
}

export async function updateSeriesAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const result = await updateSeries(id, {
    name: name?.trim() || undefined,
    description: description?.trim() || null,
  })

  if (result.error) return { error: result.error }
  revalidatePath("/admin/series")
  revalidatePath(`/admin/series/${id}`)
  return { success: true as const }
}

export async function deleteSeriesAction(
  id: string
): Promise<{ error?: string }> {
  const result = await deleteSeries(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/series")
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
  const name = formData.get("name") as string

  if (!name?.trim()) return { error: "El nombre de la división es obligatorio." }

  const result = await createDivision({
    seriesId,
    name: name.trim(),
  })

  if (result.error) return { error: result.error }
  revalidatePath(`/admin/series/${seriesId}`)
  return { success: true as const }
}

export async function updateDivisionAction(
  id: string,
  seriesId: string,
  _prev: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string
  const displayOrder = formData.get("displayOrder") as string

  const result = await updateDivision(id, {
    name: name?.trim() || undefined,
    displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
  })

  if (result.error) return { error: result.error }
  revalidatePath(`/admin/series/${seriesId}`)
  return { success: true as const }
}

export async function deleteDivisionAction(
  id: string,
  seriesId: string
): Promise<{ error?: string }> {
  const result = await deleteDivision(id)
  if (result.error) return { error: result.error }
  revalidatePath(`/admin/series/${seriesId}`)
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
  const email = formData.get("email") as string
  if (!email?.trim()) return { error: "El email es obligatorio." }

  const result = await assignDelegate(teamId, email.trim())
  if (result.error) return { error: result.error }
  revalidatePath(`/admin/equipos/${teamId}`)
  return { success: true as const }
}

/** Form-compatible wrapper for assignDelegate */
export async function assignDelegateFormAction(formData: FormData): Promise<void> {
  const teamId = formData.get("teamId") as string
  const email = formData.get("email") as string
  if (!email?.trim()) throw new Error("El email es obligatorio.")

  const result = await assignDelegate(teamId, email.trim())
  if (result.error) throw new Error(result.error)
  revalidatePath(`/admin/equipos/${teamId}`)
}

export async function revokeDelegateAction(teamId: string) {
  "use server"
  const result = await revokeDelegate(teamId)
  if (result.error) return { error: result.error }
  revalidatePath(`/admin/equipos/${teamId}`)
  return { success: true as const }
}

/** Form-compatible wrapper for revokeDelegate */
export async function revokeDelegateFormAction(formData: FormData): Promise<void> {
  const teamId = formData.get("teamId") as string
  const result = await revokeDelegate(teamId)
  if (result.error) throw new Error(result.error)
  revalidatePath(`/admin/equipos/${teamId}`)
}

// ---------------------------------------------------------------------------
// Sponsor actions
// ---------------------------------------------------------------------------

export async function createSponsorAction(_prev: unknown, formData: FormData) {
  const name = formData.get("name") as string
  const logoUrl = formData.get("logoUrl") as string
  const linkUrl = formData.get("linkUrl") as string
  const displayOrder = formData.get("displayOrder") as string

  if (!name?.trim()) return { error: "El nombre es obligatorio." }
  if (!logoUrl?.trim()) return { error: "La URL del logo es obligatoria." }

  const result = await createSponsor({
    name: name.trim(),
    logoUrl: logoUrl.trim(),
    linkUrl: linkUrl?.trim() || undefined,
    displayOrder: displayOrder ? parseInt(displayOrder) : 0,
  })
  if (result.error) return { error: result.error }
  revalidatePath("/admin/sponsors")
  return { success: true as const }
}

export async function updateSponsorAction(id: string, _prev: unknown, formData: FormData) {
  const name = formData.get("name") as string
  const logoUrl = formData.get("logoUrl") as string
  const linkUrl = formData.get("linkUrl") as string
  const displayOrder = formData.get("displayOrder") as string

  const result = await updateSponsor(id, {
    name: name?.trim() || undefined,
    logoUrl: logoUrl?.trim() || undefined,
    linkUrl: linkUrl?.trim() || null,
    displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
  })
  if (result.error) return { error: result.error }
  revalidatePath("/admin/sponsors")
  return { success: true as const }
}

export async function deleteSponsorAction(id: string): Promise<{ error?: string }> {
  const result = await deleteSponsor(id)
  if (result.error) return { error: result.error }
  revalidatePath("/admin/sponsors")
  return {}
}
