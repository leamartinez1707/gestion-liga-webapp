"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, Newspaper, Trophy } from "lucide-react"

import { leagueInfo } from "@/lib/data/league"
import { matches } from "@/lib/data/matches"
import { teams } from "@/lib/data/teams"
import { newsArticles } from "@/lib/data/news"
import { seriesOptions } from "@/lib/data/series"
import { calculateStandings } from "@/lib/db/standings"
import { SeriesSelector } from "@/components/series-selector"
import { StandingsSidebar } from "@/components/standings-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function getTeamName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? teamId
}

function getTeamShortName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.shortName ?? teamId
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export default function HomePage() {
  const [selectedSeries, setSelectedSeries] = useState(seriesOptions[0]?.id ?? "")
  const [selectedDivision, setSelectedDivision] = useState("")

  const currentSeries = seriesOptions.find((s) => s.id === selectedSeries)
  const currentDivision = currentSeries?.divisions.find((d) => d.id === selectedDivision)

  // When series changes, auto-select first division
  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeries(seriesId)
    const series = seriesOptions.find((s) => s.id === seriesId)
    if (series?.divisions[0]) {
      setSelectedDivision(series.divisions[0].id)
    }
  }

  // Init first division on mount
  useMemo(() => {
    if (!selectedDivision && currentSeries?.divisions[0]) {
      setSelectedDivision(currentSeries.divisions[0].id)
    }
  }, [selectedSeries, selectedDivision, currentSeries])

  // Filter by category for now (maps to division concept)
  const divisionLabel = currentDivision?.name ?? ""
  const categoryFilter = currentSeries?.slug === "serie-1" ? "Primera División"
    : currentSeries?.slug === "serie-2" ? "Segunda División"
    : ""

  const filteredTeams = categoryFilter
    ? teams.filter((t) => t.category === categoryFilter)
    : teams

  const filteredTeamIds = new Set(filteredTeams.map((t) => t.id))

  const filteredMatches = matches.filter(
    (m) => filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId)
  )

  const standings = useMemo(
    () => calculateStandings(filteredMatches, filteredTeams),
    [filteredMatches, filteredTeams]
  )

  const upcomingMatches = filteredMatches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5)

  const latestNews = newsArticles
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return (
    <div>
      {/* Header with series selector */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-primary-foreground md:text-2xl">
                {leagueInfo.name}
              </h1>
              <p className="text-sm text-primary-foreground/70">
                {leagueInfo.currentSeason}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-white/90 self-start"
              render={<Link href={leagueInfo.ctaHref} />}
            >
              {leagueInfo.ctaText}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <SeriesSelector
            series={seriesOptions}
            selectedSeries={selectedSeries}
            selectedDivision={selectedDivision}
            onSeriesChange={handleSeriesChange}
            onDivisionChange={setSelectedDivision}
          />
        </div>
      </div>

      {/* Two-column content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-8">
            {/* Standings highlight (mobile) */}
            <div className="lg:hidden">
              <Card className="border-border">
                <CardContent className="p-4">
                  <StandingsSidebar standings={standings} />
                </CardContent>
              </Card>
            </div>

            {/* Upcoming matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Próximos Partidos</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/partidos" />}>
                  Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              {upcomingMatches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm"
                    >
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-medium truncate">{getTeamShortName(match.homeTeamId)}</p>
                      </div>
                      <div className="shrink-0 text-center">
                        <p className="text-xs font-semibold text-muted-foreground">vs</p>
                        <p className="text-[10px] text-muted-foreground">{match.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getTeamShortName(match.awayTeamId)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No hay partidos programados.</p>
              )}
            </section>

            {/* Latest results */}
            {(() => {
              const results = filteredMatches
                .filter((m) => m.status === "finished")
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 4)
              if (results.length === 0) return null
              return (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <h2 className="text-base font-bold text-foreground">Últimos Resultados</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/partidos" />}>
                      Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {results.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm"
                      >
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                          {formatDate(match.date)}
                        </span>
                        <div className="flex-1 text-right min-w-0">
                          <p className="font-medium truncate">{getTeamShortName(match.homeTeamId)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-base font-bold tabular-nums">{match.homeScore}</span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="text-base font-bold tabular-nums">{match.awayScore}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getTeamShortName(match.awayTeamId)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Latest news */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Últimas Noticias</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/actualidad" />}>
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {latestNews.map((article) => (
                  <Link key={article.id} href={`/actualidad/${article.id}`}>
                    <div className="rounded-lg border border-border bg-background p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          {article.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(article.date)}</span>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug">{article.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-6">
            {/* Standings */}
            <Card className="border-border">
              <CardContent className="p-4">
                <StandingsSidebar standings={standings} />
              </CardContent>
            </Card>

            {/* Quick links */}
            <div className="space-y-1">
              <Link
                href="/equipos"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted-bg transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Equipos
              </Link>
              <Link
                href="/partidos"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted-bg transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Calendario Completo
              </Link>
              <Link
                href="/institucional"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted-bg transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Reglamento
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
