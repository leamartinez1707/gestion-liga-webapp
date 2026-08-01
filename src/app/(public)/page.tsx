import { Suspense } from "react"
import { getSeries, getDivisions } from "@/lib/db/series"
import { getTeams } from "@/lib/db/teams"
import { getMatches } from "@/lib/db/matches"
import { getArticles } from "@/lib/db/news"
import { leagueInfo } from "@/lib/data/league"
import type { NewsArticle } from "@/lib/types"
import type { ArticleRow } from "@/lib/db/news"
import type { SeriesOption } from "@/components/series-selector"
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

export default async function HomePage() {
  const [seriesResult, divisionsResult, teamsResult, matchesResult, articlesResult] =
    await Promise.all([
      getSeries(),
      getDivisions(),
      getTeams(),
      getMatches(),
      getArticles(),
    ])

  const seriesList = seriesResult.data ?? []
  const divisionsList = divisionsResult.data ?? []

  const seriesOptions: SeriesOption[] = seriesList.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    divisions: divisionsList
      .filter((d) => d.seriesId === s.id)
      .map((d) => ({ id: d.id, name: d.name })),
  }))

  const teams = teamsResult.data ?? []
  const matches = matchesResult.data ?? []
  const articles = (articlesResult.data ?? []).map(mapArticleRowToNewsArticle)

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>}>
      <HomePageClient
        seriesOptions={seriesOptions}
        teams={teams}
        matches={matches}
        articles={articles}
        leagueInfo={leagueInfo}
      />
    </Suspense>
  )
}
