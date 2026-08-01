"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import type { Match, Team, NewsArticle } from "@/lib/types"
import type { MatchWithTeams } from "@/lib/db/matches"
import type { LeagueInfo } from "@/lib/types"
import type { SeriesOption } from "@/components/series-selector"
import { calculateStandings } from "@/lib/db/standings"
import { StandingsSidebar } from "@/components/standings-sidebar"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainCarousel } from "@/components/main-carousel"
import { ScrollableBanners } from "@/components/scrollable-banners"
import { FixturePanel } from "@/components/fixture-panel"
import { Card, CardContent } from "@/components/ui/card"

function toDivSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

interface HomePageClientProps {
  seriesOptions: SeriesOption[]
  teams: Team[]
  matches: MatchWithTeams[]
  articles: NewsArticle[]
  leagueInfo: LeagueInfo
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
  matches,
  articles,
  leagueInfo: _leagueInfo,
}: HomePageClientProps) {
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  const currentSeries =
    seriesOptions.find((s) => s.slug === paramSerie) ??
    seriesOptions[0]

  const currentDivision = currentSeries?.divisions.find(
    (d) => toDivSlug(d.name) === paramDiv
  )

  const selectedSeriesId = currentSeries?.id ?? ""
  const selectedDivisionId = currentDivision?.id ?? ""

  // Filter teams by selected series AND division
  const filteredTeams = (() => {
    let result = teams

    if (selectedSeriesId) {
      result = result.filter((t) => t.seriesId === selectedSeriesId)
    }

    if (selectedDivisionId) {
      result = result.filter((t) => t.divisionId === selectedDivisionId)
    }

    return result
  })()

  const filteredTeamIds = new Set(filteredTeams.map((t) => t.id))
  const filteredMatches = matches.filter(
    (m) => filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId)
  )

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

  const seriesNews = selectedSeriesId
    ? sortedNews.filter((a) => a.seriesId === selectedSeriesId)
    : sortedNews

  const teamMap = new Map(teams.map((t) => [t.id, t]))

  function getTeamName(teamId: string): string {
    return teamMap.get(teamId)?.name ?? teamId
  }

  return (
    <div className="w-full px-4 md:px-6 py-5">
      <div className="grid gap-5 lg:grid-cols-[200px_1fr_300px]">
        {/* ===== LEFT SIDEBAR ===== */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftSidebar />
          </div>
        </div>
        <div className="lg:hidden">
          <LeftSidebar />
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

          {filteredTeams.length === 0 && selectedDivisionId && (
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
