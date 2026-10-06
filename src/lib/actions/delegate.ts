"use server"

import { revalidatePath } from "next/cache"

import { requireDelegateTeam } from "@/lib/auth"
import { uploadOptionalImage } from "@/lib/actions/upload"
import { getPlayer, createPlayer, updatePlayer, deletePlayer } from "@/lib/db/players"
import { updateTeam } from "@/lib/db/teams"
import { getRegistration, setRoster } from "@/lib/db/registrations"
import type { Player } from "@/lib/types"

// Delegate actions always work on the delegate's own team (from their profile),
// never on a team id sent by the client. RLS enforces the same rule in the DB.

const POSITIONS: Player["position"][] = ["arquero", "defensa", "mediocampista", "delantero"]

function parsePosition(value: FormDataEntryValue | null): Player["position"] | undefined {
  return POSITIONS.find((p) => p === value)
}

// Public pages are statically rendered: refresh the whole site after a change.
function revalidateSite() {
  revalidatePath("/", "layout")
}

async function ownPlayer(playerId: string, teamId: string) {
  const { data } = await getPlayer(playerId)
  return data?.teamId === teamId
}

export async function delegateUpdateTeamAction(_prev: unknown, formData: FormData) {
  const auth = await requireDelegateTeam()
  if (!auth.profile) return { error: auth.error }
  const { teamId } = auth.profile

  const name = formData.get("name") as string | null
  const shortName = formData.get("shortName") as string | null
  const coach = formData.get("coach") as string | null
  const assistantCoach = formData.get("assistantCoach") as string | null

  if (!name?.trim()) return { error: "El nombre del equipo es obligatorio." }

  const { url: shieldUrl, error: uploadError } = await uploadOptionalImage(formData, "shield", "teams")
  if (uploadError) return { error: uploadError }

  // Only identity fields: series, division and tournament are managed by the league.
  const result = await updateTeam(teamId, {
    name: name.trim(),
    shortName: shortName?.trim() || undefined,
    coach: coach === null ? undefined : coach.trim() || null,
    assistantCoach: assistantCoach === null ? undefined : assistantCoach.trim() || null,
    shieldUrl: shieldUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function delegateCreatePlayerAction(_prev: unknown, formData: FormData) {
  const auth = await requireDelegateTeam()
  if (!auth.profile) return { error: auth.error }
  const { teamId } = auth.profile

  const name = formData.get("name") as string | null
  const number = formData.get("number") as string | null

  if (!name?.trim()) return { error: "El nombre del jugador es obligatorio." }

  const { url: photoUrl, error: uploadError } = await uploadOptionalImage(formData, "photo", "players")
  if (uploadError) return { error: uploadError }

  const result = await createPlayer({
    name: name.trim(),
    number: number ? parseInt(number, 10) : 0,
    position: parsePosition(formData.get("position")) ?? "delantero",
    teamId,
    photo: photoUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function delegateUpdatePlayerAction(
  playerId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireDelegateTeam()
  if (!auth.profile) return { error: auth.error }
  const { teamId } = auth.profile

  if (!(await ownPlayer(playerId, teamId))) {
    return { error: "Ese jugador no pertenece a tu equipo." }
  }

  const name = formData.get("name") as string | null
  const number = formData.get("number") as string | null

  if (!name?.trim()) return { error: "El nombre del jugador es obligatorio." }

  const { url: photoUrl, error: uploadError } = await uploadOptionalImage(formData, "photo", "players")
  if (uploadError) return { error: uploadError }

  const result = await updatePlayer(playerId, {
    name: name.trim(),
    number: number ? parseInt(number, 10) : undefined,
    position: parsePosition(formData.get("position")),
    photo: photoUrl ?? undefined,
  })

  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}

export async function delegateDeletePlayerAction(
  playerId: string
): Promise<{ error?: string }> {
  const auth = await requireDelegateTeam()
  if (!auth.profile) return { error: auth.error }
  const { teamId } = auth.profile

  if (!(await ownPlayer(playerId, teamId))) {
    return { error: "Ese jugador no pertenece a tu equipo." }
  }

  const result = await deletePlayer(playerId)
  if (result.error) return { error: result.error }
  revalidateSite()
  return {}
}

/** Lista de buena fe of one of the delegate's own registrations. */
export async function delegateSetRosterAction(
  registrationId: string,
  _prev: unknown,
  formData: FormData
) {
  const auth = await requireDelegateTeam()
  if (!auth.profile) return { error: auth.error }

  const { data: registration } = await getRegistration(registrationId)
  if (registration?.teamId !== auth.profile.teamId) {
    return { error: "Esa inscripción no es de tu equipo." }
  }

  const playerIds = formData.getAll("playerIds").filter((v): v is string => typeof v === "string")
  const result = await setRoster(registrationId, playerIds)
  if (result.error) return { error: result.error }
  revalidateSite()
  return { success: true as const }
}
