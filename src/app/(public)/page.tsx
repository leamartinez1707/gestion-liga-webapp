import { Suspense } from "react"
import { getSeriesOptions } from "@/lib/db/series"
import { getTournaments } from "@/lib/db/tournaments"
import { getRegistrations } from "@/lib/db/registrations"
import { getTeams } from "@/lib/db/teams"
import { getMatches } from "@/lib/db/matches"
import { getArticles } from "@/lib/db/news"
import { getSponsors } from "@/lib/db/sponsors"
import { leagueInfo } from "@/lib/data/league"
import type { NewsArticle } from "@/lib/types"
import type { ArticleRow } from "@/lib/db/news"
import { HomePageClient } from "./home-client"

function mapArticleRowToNewsArticle(row: ArticleRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    image: row.imageUrl ?? "/placeholder.svg",
    date: row.date,
    category: row.category ?? "General",
    seriesId: row.seriesId ?? undefined,
    published: row.published,
  }
}

// Safety net for edits made directly in Supabase; panel actions revalidate immediately.
export const revalidate = 300

export default async function HomePage() {
  const [seriesOptions, teamsResult, tournamentsResult, registrationsResult, matchesResult, articlesResult, sponsorsResult] =
    await Promise.all([
      getSeriesOptions(),
      getTeams(),
      getTournaments(),
      getRegistrations(),
      getMatches(),
      getArticles(),
      getSponsors(),
    ])

  const teams = teamsResult.data ?? []
  const matches = matchesResult.data ?? []
  const articles = (articlesResult.data ?? []).map(mapArticleRowToNewsArticle)

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>}>
      <HomePageClient
        seriesOptions={seriesOptions}
        teams={teams}
        tournaments={tournamentsResult.data ?? []}
        registrations={registrationsResult.data ?? []}
        matches={matches}
        articles={articles}
        leagueInfo={leagueInfo}
        sponsors={sponsorsResult.data ?? []}
      />
    </Suspense>
  )
}
