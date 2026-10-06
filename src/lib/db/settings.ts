import type { LeagueSettings } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

const DEFAULTS: LeagueSettings = {
  yellowCardsForSuspension: 5,
  yellowSuspensionMatches: 1,
  redCardMatches: 1,
  guestPlayersAllowed: false,
  guestPlayerMaxMatches: 1,
}

export async function getLeagueSettings(): Promise<LeagueSettings> {
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase.from("league_settings").select("*").maybeSingle()
    if (!data) return DEFAULTS
    return {
      yellowCardsForSuspension: data.yellow_cards_for_suspension,
      yellowSuspensionMatches: data.yellow_suspension_matches,
      redCardMatches: data.red_card_matches,
      guestPlayersAllowed: data.guest_players_allowed,
      guestPlayerMaxMatches: data.guest_player_max_matches,
    }
  } catch {
    return DEFAULTS
  }
}

/** Staff only (RLS). */
export async function updateLeagueSettings(settings: LeagueSettings): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("league_settings")
      .update({
        yellow_cards_for_suspension: settings.yellowCardsForSuspension,
        yellow_suspension_matches: settings.yellowSuspensionMatches,
        red_card_matches: settings.redCardMatches,
        guest_players_allowed: settings.guestPlayersAllowed,
        guest_player_max_matches: settings.guestPlayerMaxMatches,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo guardar la configuración." }
  }
}
