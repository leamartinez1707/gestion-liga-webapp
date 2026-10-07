// Cédula and phone of the players. Private: read with the session client, so
// RLS lets only staff, the team's delegates and referees see them. Never on
// the public site.

import { createClient } from "@/lib/supabase/server"
import { uuids } from "./ids"

export interface PlayerPrivate {
  document: string
  phone: string
}

export async function getPlayerPrivate(playerIds: string[]): Promise<Map<string, PlayerPrivate>> {
  const result = new Map<string, PlayerPrivate>()
  const ids = uuids(playerIds)
  if (ids.length === 0) return result
  try {
    const supabase = await createClient()
    // Chunked: a long list of ids doesn't fit in one URL
    for (let i = 0; i < ids.length; i += 150) {
      const { data } = await supabase
        .from("player_private")
        .select("player_id, document, phone")
        .in("player_id", ids.slice(i, i + 150))
      for (const r of data ?? []) result.set(r.player_id, { document: r.document ?? "", phone: r.phone ?? "" })
    }
  } catch {
    // Optional data
  }
  return result
}

/** Only digits for the cédula ("1.234.567-8" → "12345678"); the phone keeps + and spaces. */
export function cleanDocument(value: string): string {
  return value.replace(/\D/g, "").slice(0, 20)
}
export function cleanPhone(value: string): string {
  return value.replace(/[^\d+ ]/g, "").trim().slice(0, 25)
}

/** From the player form's "document" and "phone" fields. Missing fields are left as they are. */
export async function savePlayerPrivate(playerId: string, formData: FormData): Promise<{ error?: string }> {
  if (!formData.has("document") && !formData.has("phone")) return {}
  const document = cleanDocument((formData.get("document") as string | null) ?? "")
  const phone = cleanPhone((formData.get("phone") as string | null) ?? "")
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("player_private").upsert({
      player_id: playerId,
      document: document || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    return error ? { error: "Se guardó el jugador, pero no la cédula y el teléfono." } : {}
  } catch {
    return { error: "Se guardó el jugador, pero no la cédula y el teléfono." }
  }
}
