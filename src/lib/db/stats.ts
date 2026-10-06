import { createReadOnlyClient } from "@/lib/supabase/server"

/** Admin dashboard totals: counted by the database, no rows travel. */
export async function getDashboardCounts(): Promise<{
  teams: number | null
  tournaments: number | null
  finishedMatches: number | null
  publishedArticles: number | null
}> {
  try {
    const supabase = createReadOnlyClient()
    const [teams, tournaments, matches, articles] = await Promise.all([
      supabase.from("teams").select("id", { count: "exact", head: true }),
      supabase.from("tournaments").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "finished"),
      supabase.from("news_articles").select("id", { count: "exact", head: true }).eq("published", true),
    ])
    return {
      teams: teams.count,
      tournaments: tournaments.count,
      finishedMatches: matches.count,
      publishedArticles: articles.count,
    }
  } catch {
    return { teams: null, tournaments: null, finishedMatches: null, publishedArticles: null }
  }
}
