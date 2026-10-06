import type { Photo, PhotoAlbum } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export const GALLERY_BUCKET = "public-images"

type AlbumRow = {
  id: string
  title: string
  description: string | null
  date: string | null
  series_id: string | null
  match_id: string | null
  cover_url: string | null
  published: boolean
  photos?: { count: number }[]
}

function mapAlbum(row: AlbumRow): PhotoAlbum {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date ?? "",
    seriesId: row.series_id ?? undefined,
    matchId: row.match_id ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    published: row.published,
    photoCount: row.photos?.[0]?.count ?? 0,
  }
}

function mapPhoto(row: { id: string; album_id: string; url: string; caption: string | null; display_order: number }): Photo {
  return {
    id: row.id,
    albumId: row.album_id,
    url: row.url,
    caption: row.caption ?? undefined,
    displayOrder: row.display_order,
  }
}

/**
 * Albums, newest first. Public pages get published ones only (RLS); pass
 * `asStaff` from the admin to read drafts with the session.
 */
export async function getAlbums(
  filter: { matchIds?: string[]; asStaff?: boolean } = {}
): Promise<{ data: PhotoAlbum[] | null; error: string | null }> {
  try {
    const supabase = filter.asStaff ? await createClient() : createReadOnlyClient()
    let query = supabase
      .from("photo_albums")
      .select("*, photos(count)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
    if (filter.matchIds) {
      if (filter.matchIds.length === 0) return { data: [], error: null }
      query = query.in("match_id", filter.matchIds)
    }
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: (data as AlbumRow[]).map(mapAlbum), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getAlbum(
  id: string,
  asStaff = false
): Promise<{ data: PhotoAlbum | null; error: string | null }> {
  try {
    const supabase = asStaff ? await createClient() : createReadOnlyClient()
    const { data, error } = await supabase
      .from("photo_albums")
      .select("*, photos(count)")
      .eq("id", id)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapAlbum(data as AlbumRow) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getPhotos(
  albumId: string,
  asStaff = false
): Promise<{ data: Photo[] | null; error: string | null }> {
  try {
    const supabase = asStaff ? await createClient() : createReadOnlyClient()
    const { data, error } = await supabase
      .from("photos")
      .select("id, album_id, url, caption, display_order")
      .eq("album_id", albumId)
      .order("display_order")
      .order("created_at")
    if (error) return { data: null, error: error.message }
    return { data: data.map(mapPhoto), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export interface AlbumInput {
  title: string
  description: string | null
  date: string | null
  seriesId: string | null
  matchId: string | null
  published: boolean
}

export async function createAlbum(input: AlbumInput): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("photo_albums")
      .insert({
        title: input.title,
        description: input.description,
        date: input.date ?? undefined,
        series_id: input.seriesId,
        match_id: input.matchId,
        published: input.published,
      })
      .select("id")
      .single()
    if (error) return { error: error.message }
    return { id: data.id }
  } catch {
    return { error: "No se pudo crear el álbum." }
  }
}

export async function updateAlbum(
  id: string,
  input: Partial<AlbumInput> & { coverUrl?: string | null }
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("photo_albums")
      .update({
        title: input.title,
        description: input.description,
        date: input.date ?? undefined,
        series_id: input.seriesId,
        match_id: input.matchId,
        published: input.published,
        cover_url: input.coverUrl,
      })
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar el álbum." }
  }
}

/** Storage path inside the bucket from a public URL, or null if it isn't ours. */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${GALLERY_BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

export async function deleteAlbum(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: photos } = await supabase.from("photos").select("url").eq("album_id", id)
    const { error } = await supabase.from("photo_albums").delete().eq("id", id)
    if (error) return { error: error.message }
    const paths = (photos ?? []).map((p) => storagePathFromUrl(p.url)).filter((p): p is string => !!p)
    if (paths.length > 0) await supabase.storage.from(GALLERY_BUCKET).remove(paths)
    return {}
  } catch {
    return { error: "No se pudo eliminar el álbum." }
  }
}

/** Records photos already uploaded to Storage by the browser. */
export async function addPhotos(albumId: string, urls: string[]): Promise<{ error?: string }> {
  if (urls.length === 0) return {}
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("album_id", albumId)
    const start = count ?? 0
    const { error } = await supabase
      .from("photos")
      .insert(urls.map((url, i) => ({ album_id: albumId, url, display_order: start + i })))
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudieron guardar las fotos." }
  }
}

export async function deletePhoto(id: string): Promise<{ error?: string; albumId?: string; url?: string }> {
  try {
    const supabase = await createClient()
    const { data: photo } = await supabase.from("photos").select("album_id, url").eq("id", id).maybeSingle()
    if (!photo) return { error: "La foto no existe." }
    const { error } = await supabase.from("photos").delete().eq("id", id)
    if (error) return { error: error.message }
    const path = storagePathFromUrl(photo.url)
    if (path) await supabase.storage.from(GALLERY_BUCKET).remove([path])
    return { albumId: photo.album_id, url: photo.url }
  } catch {
    return { error: "No se pudo eliminar la foto." }
  }
}
