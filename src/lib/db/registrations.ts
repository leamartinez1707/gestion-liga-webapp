import type { Registration } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

function mapRow(row: { id: string; tournament_id: string; team_id: string; withdrawn_at: string | null }): Registration {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    teamId: row.team_id,
    withdrawnAt: row.withdrawn_at ?? undefined,
  }
}

export async function getRegistrations(
  filter: { tournamentId?: string; teamId?: string } = {}
): Promise<{ data: Registration[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    let query = supabase.from("registrations").select("id, tournament_id, team_id, withdrawn_at")
    if (filter.tournamentId) query = query.eq("tournament_id", filter.tournamentId)
    if (filter.teamId) query = query.eq("team_id", filter.teamId)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data.map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getRegistration(id: string): Promise<{ data: Registration | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("registrations")
      .select("id, tournament_id, team_id, withdrawn_at")
      .eq("id", id)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRow(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

/** Player ids in the "lista de buena fe" of each registration. */
export async function getRosters(
  registrationIds: string[]
): Promise<{ data: Map<string, string[]>; error: string | null }> {
  const rosters = new Map<string, string[]>(registrationIds.map((id) => [id, []]))
  if (registrationIds.length === 0) return { data: rosters, error: null }
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("registration_players")
      .select("registration_id, player_id")
      .in("registration_id", registrationIds)
    if (error) return { data: rosters, error: error.message }
    for (const row of data) rosters.get(row.registration_id)?.push(row.player_id)
    return { data: rosters, error: null }
  } catch {
    return { data: rosters, error: "No se pudo conectar con la base de datos." }
  }
}

/** Staff only (RLS). The DB rejects a second division of the same series in one season. */
export async function createRegistration(
  tournamentId: string,
  teamId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("registrations")
      .insert({ tournament_id: tournamentId, team_id: teamId })
    if (error) {
      if (error.code === "23505") return { error: "El equipo ya está inscripto en este torneo." }
      return { error: error.message }
    }
    return {}
  } catch {
    return { error: "No se pudo inscribir al equipo." }
  }
}

export async function deleteRegistration(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("registrations").delete().eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar la inscripción." }
  }
}

/**
 * Replaces the roster ("lista de buena fe") of a registration.
 * Staff or the team's delegate (RLS); the DB checks players belong to the team
 * and aren't listed by another team in the same tournament.
 */
export async function setRoster(
  registrationId: string,
  playerIds: string[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: current, error: readError } = await supabase
      .from("registration_players")
      .select("player_id")
      .eq("registration_id", registrationId)
    if (readError) return { error: readError.message }

    const wanted = new Set(playerIds)
    const existing = new Set(current.map((r) => r.player_id))
    const toRemove = [...existing].filter((id) => !wanted.has(id))
    const toAdd = [...wanted].filter((id) => !existing.has(id))

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("registration_players")
        .delete()
        .eq("registration_id", registrationId)
        .in("player_id", toRemove)
      if (error) return { error: error.message }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase
        .from("registration_players")
        .insert(toAdd.map((player_id) => ({ registration_id: registrationId, player_id })))
      if (error) {
        if (error.code === "23505") return { error: "Algún jugador ya figura en otro equipo de este torneo." }
        return { error: error.message }
      }
    }
    return {}
  } catch {
    return { error: "No se pudo guardar la lista de buena fe." }
  }
}

/**
 * Staff only (RPC). Marks the team as withdrawn; its pending matches become
 * W.O. 3-0 for the opponent. Returns how many matches were converted.
 */
export async function withdrawRegistration(id: string): Promise<{ error?: string; count?: number }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("withdraw_team", { p_registration_id: id })
    if (error) return { error: error.message }
    return { count: data }
  } catch {
    return { error: "No se pudo dar de baja al equipo." }
  }
}
