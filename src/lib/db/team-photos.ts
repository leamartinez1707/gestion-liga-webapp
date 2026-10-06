import { createClient, createReadOnlyClient } from "@/lib/supabase/server"
import { GALLERY_BUCKET, storagePathFromUrl } from "@/lib/db/gallery"

export interface TeamSeasonPhoto {
  id: string
  teamId: string
  season: string
  url: string
}

/** Squad photos of a team, newest season first. */
export async function getTeamSeasonPhotos(teamId: string): Promise<TeamSeasonPhoto[]> {
  try {
    const supabase = createReadOnlyClient()
    const { data } = await supabase
      .from("team_season_photos")
      .select("id, team_id, season, url")
      .eq("team_id", teamId)
      .order("season", { ascending: false })
    return (data ?? []).map((r) => ({ id: r.id, teamId: r.team_id, season: r.season, url: r.url }))
  } catch {
    return []
  }
}

/** One photo per team and season: replaces the previous one (and removes its file). */
export async function setTeamSeasonPhoto(teamId: string, season: string, url: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: previous } = await supabase
      .from("team_season_photos")
      .select("url")
      .eq("team_id", teamId)
      .eq("season", season)
      .maybeSingle()
    const { error } = await supabase
      .from("team_season_photos")
      .upsert({ team_id: teamId, season, url }, { onConflict: "team_id,season" })
    if (error) return { error: error.message }
    const oldPath = previous?.url && previous.url !== url ? storagePathFromUrl(previous.url) : null
    if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath])
    return {}
  } catch {
    return { error: "No se pudo guardar la foto." }
  }
}

export async function deleteTeamSeasonPhoto(id: string, teamId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: photo } = await supabase.from("team_season_photos").select("url").eq("id", id).eq("team_id", teamId).maybeSingle()
    const { error } = await supabase.from("team_season_photos").delete().eq("id", id).eq("team_id", teamId)
    if (error) return { error: error.message }
    const path = photo?.url ? storagePathFromUrl(photo.url) : null
    if (path) await supabase.storage.from(GALLERY_BUCKET).remove([path])
    return {}
  } catch {
    return { error: "No se pudo borrar la foto." }
  }
}
