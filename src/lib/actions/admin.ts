"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createTournament,
  updateTournament,
  deleteTournament,
} from "@/lib/db/tournaments"
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
import type { Player } from "@/lib/types"

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

  const result = await createTeam({
    name: name.trim(),
    shortName: shortName.trim(),
    category: category.trim(),
    coach: coach?.trim() || undefined,
    assistantCoach: assistantCoach?.trim() || undefined,
    tournamentId: tournamentId || undefined,
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

  const result = await updateTeam(id, {
    name: name.trim(),
    shortName: shortName?.trim() || undefined,
    category: category?.trim() || undefined,
    coach: coach?.trim() || null,
    assistantCoach: assistantCoach?.trim() || null,
    tournamentId: tournamentId || null,
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

  const result = await createPlayer({
    name: name.trim(),
    number: number ? parseInt(number, 10) : 0,
    position: (position as Player["position"]) ?? "delantero",
    teamId,
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

  const result = await updatePlayer(id, {
    name: name.trim(),
    number: number ? parseInt(number, 10) : undefined,
    position: (position as Player["position"]) || undefined,
    teamId: teamId || undefined,
    active: active === "true",
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
