"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { leagueInfo } from "@/lib/data/league"
import { matches } from "@/lib/data/matches"
import { teams } from "@/lib/data/teams"
import { newsArticles } from "@/lib/data/news"
import { seriesOptions } from "@/lib/data/series"
import { calculateStandings } from "@/lib/db/standings"
import { SeriesSelector } from "@/components/series-selector"
import { StandingsSidebar } from "@/components/standings-sidebar"
import { LeftSidebar } from "@/components/left-sidebar"
import { FeaturedBanner } from "@/components/featured-banner"
import { FixturePanel } from "@/components/fixture-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function getTeamName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? teamId
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

export default function HomePage() {
  const [selectedSeries, setSelectedSeries] = useState(seriesOptions[0]?.id ?? "")
  const [selectedDivision, setSelectedDivision] = useState("")

  const currentSeries = seriesOptions.find((s) => s.id === selectedSeries)

  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeries(seriesId)
    const series = seriesOptions.find((s) => s.id === seriesId)
    if (series?.divisions[0]) {
      setSelectedDivision(series.divisions[0].id)
    }
  }

  useEffect(() => {
    if (!selectedDivision && currentSeries?.divisions[0]) {
      setSelectedDivision(currentSeries.divisions[0].id)
    }
  }, [selectedSeries, selectedDivision, currentSeries])

  // Map series to category filter
  const categoryFilter =
    currentSeries?.slug === "serie-1" ? "Primera División"
    : currentSeries?.slug === "serie-2" ? "Segunda División"
    : ""

  const filteredTeams = categoryFilter
    ? teams.filter((t) => t.category === categoryFilter)
    : teams

  const filteredTeamIds = new Set(filteredTeams.map((t) => t.id))
  const filteredMatches = matches.filter(
    (m) => filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId)
  )
  const filteredNews = newsArticles

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

  const latestNews = [...filteredNews].sort((a, b) => b.date.localeCompare(a.date))

  // Featured: main banner = latest news with a match, or just first news
  const featuredArticle = latestNews[0]
  const featuredMatch = featuredArticle
    ? finishedMatches[0]
    : undefined

  // Small banners: rest of news
  const smallBanners = latestNews.slice(1, 5)

  return (
    <div>
      {/* Header with series selector */}
      <div className="bg-primary">
        <div className="w-full px-4 md:px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-primary-foreground md:text-2xl">
                {leagueInfo.name}
              </h1>
              <p className="text-sm text-primary-foreground/70">
                {currentSeries?.name} — {leagueInfo.currentSeason}
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

      {/* 3-column layout */}
      <div className="w-full px-4 md:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_320px]">
          {/* ========== LEFT SIDEBAR ========== */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <LeftSidebar />
            </div>
          </div>

          {/* Mobile sidebar toggle (simplified) */}
          <div className="lg:hidden">
            <LeftSidebar />
          </div>

          {/* ========== CENTER: Banners + News ========== */}
          <div className="space-y-6 min-w-0">
            {/* Featured banner (large) */}
            {featuredArticle && (
              <FeaturedBanner
                article={featuredArticle}
                match={featuredMatch}
                homeTeam={featuredMatch ? teams.find((t) => t.id === featuredMatch.homeTeamId) : undefined}
                awayTeam={featuredMatch ? teams.find((t) => t.id === featuredMatch.awayTeamId) : undefined}
                size="large"
                getTeamName={getTeamName}
                formatDate={formatDate}
              />
            )}

            {/* Small banners grid */}
            {smallBanners.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Últimas Portadas
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {smallBanners.map((article) => {
                    const relatedMatch = finishedMatches.find(
                      (m) => article.title.toLowerCase().includes(getTeamName(m.homeTeamId).toLowerCase().split(" ").slice(0, 2).join(" "))
                    )
                    return (
                      <FeaturedBanner
                        key={article.id}
                        article={article}
                        match={relatedMatch}
                        homeTeam={relatedMatch ? teams.find((t) => t.id === relatedMatch.homeTeamId) : undefined}
                        awayTeam={relatedMatch ? teams.find((t) => t.id === relatedMatch.awayTeamId) : undefined}
                        size="small"
                        getTeamName={getTeamName}
                        formatDate={formatDate}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* No news state */}
            {latestNews.length === 0 && (
              <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted-bg text-sm text-muted-foreground">
                No hay novedades todavía
              </div>
            )}
          </div>

          {/* ========== RIGHT PANEL ========== */}
          <div className="space-y-6">
            {/* Standings */}
            <Card className="border-border">
              <CardContent className="p-4">
                <StandingsSidebar standings={standings} />
              </CardContent>
            </Card>

            {/* Fixture - last completed stage */}
            <Card className="border-border">
              <CardContent className="p-4">
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
    </div>
  )
}
