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
import { MainCarousel } from "@/components/main-carousel"
import { ScrollableBanners } from "@/components/scrollable-banners"
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

  // Map series slug to category filter
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

  const sortedNews = [...newsArticles].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      {/* ========== HEADER ========== */}
      <div className="bg-gradient-to-b from-primary to-primary/95">
        <div className="w-full px-4 md:px-6 py-4 md:py-5">
          {/* Top bar: league name + CTA + season */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-sm md:text-base font-bold text-primary-foreground tracking-tight">
                {leagueInfo.name}
              </h1>
              <p className="text-[11px] md:text-xs text-primary-foreground/60">
                {currentSeries?.name} · {leagueInfo.currentSeason}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white/90 text-primary hover:bg-white text-xs h-8 px-3"
              render={<Link href={leagueInfo.ctaHref} />}
            >
              {leagueInfo.ctaText}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {/* SERIES — main attraction */}
          <SeriesSelector
            series={seriesOptions}
            selectedSeries={selectedSeries}
            selectedDivision={selectedDivision}
            onSeriesChange={handleSeriesChange}
            onDivisionChange={setSelectedDivision}
          />
        </div>

        {/* NAV BAR — carries series/division context */}
        <div className="border-t border-white/10">
          <div className="w-full px-4 md:px-6">
            <nav className="flex gap-0 -mb-px">
              {[
                { href: "/", label: "Inicio" },
                { href: "/equipos", label: "Equipos" },
                { href: "/partidos", label: "Partidos" },
                { href: "/actualidad", label: "Actualidad" },
                { href: "/institucional", label: "Institucional" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2.5 text-xs font-medium text-primary-foreground/70 hover:text-white border-b-2 border-transparent hover:border-white/50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ========== 3-COLUMN LAYOUT ========== */}
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
            {/* Main carousel — slideshow */}
            {sortedNews.length > 0 && (
              <MainCarousel
                articles={sortedNews.slice(0, 5)}
                matches={finishedMatches}
                teams={teams}
                getTeamName={getTeamName}
                formatDate={formatDate}
              />
            )}

            {/* Portadas por serie: one carousel row per series */}
            {seriesOptions.map((serie) => (
              <div key={serie.id}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {serie.name}
                </h2>
                <ScrollableBanners
                  articles={sortedNews.slice(0, 6)}
                  matches={finishedMatches}
                  teams={teams}
                  getTeamName={getTeamName}
                  formatDate={formatDate}
                  size="small"
                />
              </div>
            ))}

            {sortedNews.length === 0 && (
              <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted-bg text-sm text-muted-foreground">
                No hay novedades todavía
              </div>
            )}
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div className="space-y-5">
            {/* Standings */}
            <Card className="border-border">
              <CardContent className="p-3.5">
                <StandingsSidebar standings={standings} />
              </CardContent>
            </Card>

            {/* Fixture */}
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
    </div>
  )
}
