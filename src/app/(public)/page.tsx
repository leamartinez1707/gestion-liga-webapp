import { Suspense } from "react"
import { getSeriesOptions } from "@/lib/db/series"
import { getTournaments } from "@/lib/db/tournaments"
import { getRegistrations } from "@/lib/db/registrations"
import { getAlbums } from "@/lib/db/gallery"
import { getTeamsByIds } from "@/lib/db/teams"
import { getMatches } from "@/lib/db/matches"
import { getArticles } from "@/lib/db/news"
import { getSponsors } from "@/lib/db/sponsors"
import { leagueInfo } from "@/lib/data/league"
import type { NewsArticle, Tournament } from "@/lib/types"
import { todayIso, tournamentsInScope, type Scope, type SeriesOption } from "@/lib/scope"
import type { ArticleRow } from "@/lib/db/news"
import { HomePageClient } from "./home-client"

function mapArticleRowToNewsArticle(row: ArticleRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: "", // listings don't load the body
    image: row.imageUrl ?? "/placeholder.svg",
    date: row.date,
    category: row.category ?? "General",
    seriesId: row.seriesId ?? undefined,
    matchId: row.matchId ?? undefined,
    published: row.published,
  }
}

// Safety net for edits made directly in Supabase; panel actions revalidate immediately.
export const revalidate = 300

/** Each division's current tournament: the only ones the home page shows standings and fixture for. */
function currentTournamentIds(seriesOptions: SeriesOption[], tournaments: Tournament[], today: string): string[] {
  const scopes: Scope[] = seriesOptions.length
    ? seriesOptions.flatMap<Scope>((series) =>
        series.divisions.length ? series.divisions.map((division) => ({ series, division })) : [{ series, division: null }]
      )
    : [{ series: null, division: null }]
  return [...new Set(scopes.flatMap((scope) => tournamentsInScope(tournaments, scope, today)[0]?.id ?? []))]
}

/** Rows of several lists without repeating ids. */
function uniqueById<T extends { id: string }>(lists: (T[] | null)[]): T[] {
  return [...new Map(lists.flatMap((l) => l ?? []).map((item) => [item.id, item])).values()]
}

export default async function HomePage() {
  const [seriesOptions, tournamentsResult, sponsorsResult] = await Promise.all([
    getSeriesOptions(),
    getTournaments(),
    getSponsors(),
  ])
  const tournaments = tournamentsResult.data ?? []
  // The client picks the current tournament again: same "today" as the data loaded here
  const today = todayIso()
  const tournamentIds = currentTournamentIds(seriesOptions, tournaments, today)
  // The visitor picks the series on the client: bring what any series' home needs, and no more
  const seriesIds = seriesOptions.length ? seriesOptions.map((s) => s.id) : [undefined]

  const [registrationsResult, matchesResult, articleLists, albumLists] = await Promise.all([
    getRegistrations({ tournamentIds }),
    getMatches({ tournamentIds }),
    // Each series shows its latest 6 news (with the general ones); the carousel, the first 5
    Promise.all(seriesIds.map((seriesId) => getArticles({ seriesId, limit: 6 }))),
    // 4 albums with photos per series; a few spare in case some are still empty
    Promise.all(seriesIds.map((seriesId) => getAlbums({ seriesId, limit: 8 }))),
  ])

  const registrations = registrationsResult.data ?? []
  const articleRows = uniqueById(articleLists.map((r) => r.data))
  // Finished matches linked from news that aren't in the current tournaments
  const loaded = new Set((matchesResult.data ?? []).map((m) => m.id))
  const linkedIds = [...new Set(articleRows.flatMap((a) => (a.matchId && !loaded.has(a.matchId) ? [a.matchId] : [])))]
  const { data: linkedMatches } = await getMatches({ ids: linkedIds, statuses: ["finished"] })
  const matches = [...(matchesResult.data ?? []), ...(linkedMatches ?? [])]

  const { data: teams } = await getTeamsByIds([
    ...registrations.map((r) => r.teamId),
    ...matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]),
  ])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>}>
      <HomePageClient
        seriesOptions={seriesOptions}
        teams={teams ?? []}
        tournaments={tournaments}
        today={today}
        registrations={registrations}
        albums={uniqueById(albumLists.map((r) => r.data))
          .filter((a) => a.photoCount > 0)
          .sort((x, y) => y.date.localeCompare(x.date))}
        matches={matches}
        articles={articleRows.map(mapArticleRowToNewsArticle)}
        leagueInfo={leagueInfo}
        sponsors={sponsorsResult.data ?? []}
      />
    </Suspense>
  )
}
