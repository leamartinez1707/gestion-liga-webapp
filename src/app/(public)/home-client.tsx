"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import type { Team, Tournament, NewsArticle, Sponsor } from "@/lib/types"
import type { MatchWithTeams } from "@/lib/db/matches"
import type { LeagueInfo } from "@/lib/types"
import { resolveScope, teamsInScope, tournamentsInScope, type SeriesOption } from "@/lib/scope"
import { calculateStandings } from "@/lib/db/standings"
import { StandingsSidebar } from "@/components/standings-sidebar"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainCarousel } from "@/components/main-carousel"
import { ScrollableBanners } from "@/components/scrollable-banners"
import { FixturePanel } from "@/components/fixture-panel"
import { Card, CardContent } from "@/components/ui/card"

interface HomePageClientProps {
  seriesOptions: SeriesOption[]
  teams: Team[]
  tournaments: Tournament[]
  matches: MatchWithTeams[]
  articles: NewsArticle[]
  leagueInfo: LeagueInfo
  sponsors: Sponsor[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function HomePageClient({
  seriesOptions,
  teams,
  tournaments,
  matches,
  articles,
  leagueInfo: _leagueInfo,
  sponsors,
}: HomePageClientProps) {
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  const scope = resolveScope(seriesOptions, paramSerie, paramDiv)
  const selectedSeriesId = scope.series?.id ?? ""

  // Standings and fixture belong to one division: its latest tournament
  const filteredTeams = useMemo(() => teamsInScope(teams, scope), [teams, scope])
  const currentTournament = tournamentsInScope(tournaments, scope)[0]
  const filteredMatches = useMemo(() => {
    if (currentTournament) return matches.filter((m) => m.tournamentId === currentTournament.id)
    const ids = new Set(filteredTeams.map((t) => t.id))
    return matches.filter((m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId))
  }, [matches, currentTournament, filteredTeams])

  const standings = useMemo(
    () => calculateStandings(filteredMatches, filteredTeams),
    [filteredMatches, filteredTeams]
  )

  const finishedMatches = filteredMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(b.time))

  const scheduledMatches = filteredMatches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const sortedNews = [...articles].sort((a, b) => b.date.localeCompare(a.date))

  // News of the selected series plus general league news
  const seriesNews = selectedSeriesId
    ? sortedNews.filter((a) => !a.seriesId || a.seriesId === selectedSeriesId)
    : sortedNews

  const teamMap = new Map(teams.map((t) => [t.id, t]))

  function getTeamName(teamId: string): string {
    return teamMap.get(teamId)?.name ?? "—"
  }

  return (
    <div className="w-full px-4 md:px-6 py-5">
      <div className="grid gap-5 lg:grid-cols-[200px_1fr_300px]">
        {/* ===== LEFT SIDEBAR ===== */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftSidebar sponsors={sponsors} />
          </div>
        </div>
        <div className="lg:hidden">
          <LeftSidebar sponsors={sponsors} />
        </div>

        {/* ===== CENTER: BANNERS ===== */}
        <div className="space-y-6 min-w-0">
          {seriesNews.length > 0 ? (
            <MainCarousel
              articles={seriesNews.slice(0, 5)}
              matches={finishedMatches}
              teams={teams}
              getTeamName={getTeamName}
              formatDate={formatDate}
            />
          ) : (
            <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted-bg text-sm text-muted-foreground">
              No hay novedades todavía
            </div>
          )}

          {seriesOptions.map((serie) => (
            <div key={serie.id}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {serie.name}
              </h2>
              <ScrollableBanners
                articles={sortedNews.filter((a) => a.seriesId === serie.id || !a.seriesId).slice(0, 6)}
                matches={finishedMatches}
                teams={teams}
                getTeamName={getTeamName}
                formatDate={formatDate}
                size="small"
              />
            </div>
          ))}

          {filteredTeams.length === 0 && scope.division && (
            <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted-bg text-sm text-muted-foreground">
              No hay equipos en esta división todavía
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div className="space-y-5">
          <Card className="border-border">
            <CardContent className="p-1">
              <StandingsSidebar standings={standings} />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-3.5">
              <FixturePanel
                finishedMatches={finishedMatches}
                scheduledMatches={scheduledMatches}
                teams={teams}
                getTeamName={getTeamName}
                formatDate={formatDateShort}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
