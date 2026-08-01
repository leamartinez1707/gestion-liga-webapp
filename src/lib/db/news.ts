import type { NewsArticle, PaginatedResult } from "@/lib/types"
import { createReadOnlyClient, createClient } from "@/lib/supabase/server"

export async function getArticlesPaginated(
  page = 1,
  limit = 10
): Promise<PaginatedResult<ArticleRow>> {
  try {
    const supabase = createReadOnlyClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("news_articles")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(from, to)

    if (error) return { data: [], total: 0, page, totalPages: 0, error: error.message }
    return {
      data: (data ?? []).map(mapRow),
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      error: null,
    }
  } catch {
    return { data: [], total: 0, page, totalPages: 0, error: "No se pudo conectar con la base de datos." }
  }
}

export interface ArticleRow {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  imageUrl: string | null
  category: string | null
  seriesId: string | null
  published: boolean
  date: string
}

export async function getArticles(seriesId?: string): Promise<{ data: ArticleRow[] | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    let query = supabase
      .from("news_articles")
      .select("*")
      .order("date", { ascending: false })
    if (seriesId) {
      query = query.eq("series_id", seriesId)
    }
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(mapRow), error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function getArticle(id: string): Promise<{ data: ArticleRow | null; error: string | null }> {
  try {
    const supabase = createReadOnlyClient()
    const { data, error } = await supabase
      .from("news_articles")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data ? mapRow(data) : null, error: null }
  } catch {
    return { data: null, error: "No se pudo conectar con la base de datos." }
  }
}

export async function createArticle(
  data: {
    title: string
    excerpt?: string | null
    content?: string | null
    imageUrl?: string | null
    category?: string | null
    seriesId?: string | null
    published?: boolean
  }
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient()
    const { data: inserted, error } = await (supabase.from("news_articles") as any)
      .insert({
        title: data.title,
        excerpt: data.excerpt ?? null,
        content: data.content ?? null,
        image_url: data.imageUrl ?? null,
        category: data.category ?? null,
        series_id: data.seriesId ?? null,
        published: data.published ?? false,
        date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return { error: "No se pudo crear la noticia. Verificá que Supabase esté configurado." }
  }
}

export async function updateArticle(
  id: string,
  data: Partial<{
    title: string
    excerpt: string | null
    content: string | null
    imageUrl: string | null
    category: string | null
    seriesId: string | null
    published: boolean
  }>
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const payload: Record<string, unknown> = {}
    if (data.title !== undefined) payload.title = data.title
    if (data.excerpt !== undefined) payload.excerpt = data.excerpt
    if (data.content !== undefined) payload.content = data.content
    if (data.imageUrl !== undefined) payload.image_url = data.imageUrl
    if (data.category !== undefined) payload.category = data.category
    if (data.seriesId !== undefined) payload.series_id = data.seriesId
    if (data.published !== undefined) payload.published = data.published

    const { error } = await (supabase.from("news_articles") as any)
      .update(payload)
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo actualizar la noticia." }
  }
}

export async function deleteArticle(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from("news_articles") as any)
      .delete()
      .eq("id", id)
    if (error) return { error: error.message }
    return {}
  } catch {
    return { error: "No se pudo eliminar la noticia." }
  }
}

export async function publishArticle(
  id: string
): Promise<{ error?: string }> {
  return updateArticle(id, { published: true })
}

export async function unpublishArticle(
  id: string
): Promise<{ error?: string }> {
  return updateArticle(id, { published: false })
}

function mapRow(row: Record<string, unknown>): ArticleRow {
  return {
    id: row.id as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? null,
    content: (row.content as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    category: (row.category as string) ?? null,
    seriesId: (row.series_id as string) ?? null,
    published: (row.published as boolean) ?? false,
    date: (row.date as string) ?? "",
  }
}
