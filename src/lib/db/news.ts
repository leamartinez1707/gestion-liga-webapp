import type { NewsArticle } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

export interface ArticleRow {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  imageUrl: string | null
  category: string | null
  published: boolean
  date: string
}

export async function getArticles(): Promise<ArticleRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("news_articles") as any)
      .select("*")
      .order("date", { ascending: false })
    if (!data) return []
    return data.map(mapRow)
  } catch {
    const { newsArticles } = await import("@/lib/data/news")
    return newsArticles.map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      imageUrl: a.image,
      category: a.category,
      published: a.published ?? false,
      date: a.date,
    }))
  }
}

export async function getArticle(id: string): Promise<ArticleRow | null> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase.from("news_articles") as any)
      .select("*")
      .eq("id", id)
      .single()
    return data ? mapRow(data) : null
  } catch {
    const { newsArticles } = await import("@/lib/data/news")
    const article = newsArticles.find((a) => a.id === id)
    if (!article) return null
    return {
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      imageUrl: article.image,
      category: article.category,
      published: article.published ?? false,
      date: article.date,
    }
  }
}

export async function createArticle(
  data: {
    title: string
    excerpt?: string | null
    content?: string | null
    imageUrl?: string | null
    category?: string | null
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
        published: data.published ?? false,
        date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { id: inserted?.id }
  } catch {
    return {
      error: "No se pudo crear la noticia. Verificá que Supabase esté configurado.",
    }
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
    published: (row.published as boolean) ?? false,
    date: (row.date as string) ?? "",
  }
}
