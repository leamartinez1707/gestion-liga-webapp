"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import type { Team, Tournament, Registration, NewsArticle, Sponsor, PhotoAlbum } from "@/lib/types"
import Link from "next/link"
import { AlbumCard } from "@/components/album-card"
import { AutoRefresh } from "@/components/auto-refresh"
import type { MatchWithTeams } from "@/lib/db/matches"
import type { LeagueInfo } from "@/lib/types"
import { resolveScope, teamsInTournament, tournamentsInScope, withdrawnInTournament, type SeriesOption } from "@/lib/scope"
import { calculateStandings } from "@/lib/db/standings"
import { StandingsSidebar } from "@/components/standings-sidebar"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainCarousel } from "@/components/main-carousel"
import { ScrollableBanners } from "@/components/scrollable-banners"
import { FixturePanel } from "@/components/fixture-panel"
import { Card, CardContent } from "@/components/ui/card"
import { SectionTitle } from "@/components/page-header"

interface HomePageClientProps {
  seriesOptions: SeriesOption[]
  teams: Team[]
  tournaments: Tournament[]
  /** Today (Argentina) as the server saw it when loading the data */
  today: string
  registrations: Registration[]
  albums: PhotoAlbum[]
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
  registrations,
  albums,
  matches,
  articles,
  leagueInfo: _leagueInfo,
  sponsors,
  today,
}: HomePageClientProps) {
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  const scope = resolveScope(seriesOptions, paramSerie, paramDiv)
  const selectedSeriesId = scope.series?.id ?? ""

  // Standings and fixture belong to one division: its latest tournament
  const currentTournament = tournamentsInScope(tournaments, scope, today)[0]
  const filteredTeams = useMemo(
    () => teamsInTournament(teams, registrations, currentTournament?.id),
    [teams, registrations, currentTournament?.id]
  )
  const filteredMatches = useMemo(
    () => matches.filter((m) => m.tournamentId === currentTournament?.id),
    [matches, currentTournament?.id]
  )

  const standings = useMemo(
    () => calculateStandings(filteredMatches, filteredTeams, withdrawnInTournament(registrations, currentTournament?.id)),
    [filteredMatches, filteredTeams, registrations, currentTournament?.id]
  )

  const finishedMatches = filteredMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  const scheduledMatches = filteredMatches
    .filter((m) => m.status === "scheduled" || m.status === "postponed" || m.status === "ongoing")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const sortedNews = [...articles].sort((a, b) => b.date.localeCompare(a.date))

  // News of the selected series plus general league news
  const seriesNews = selectedSeriesId
    ? sortedNews.filter((a) => !a.seriesId || a.seriesId === selectedSeriesId)
    : sortedNews

  const seriesAlbums = albums
    .filter((a) => !a.seriesId || a.seriesId === selectedSeriesId)
    .slice(0, 4)

  const teamMap = new Map(teams.map((t) => [t.id, t]))

  function getTeamName(teamId: string): string {
    return teamMap.get(teamId)?.name ?? "—"
  }

  return (
    <div className="page-container py-6 md:py-8">
      <AutoRefresh active={filteredMatches.some((m) => m.status === "ongoing")} />
      <div className="grid gap-5 lg:grid-cols-[200px_1fr_300px]">
        {/* ===== LEFT SIDEBAR ===== */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftSidebar sponsors={sponsors} />
          </div>
        </div>
        {/* On mobile the shortcuts and sponsors go after the content */}
        <div className="order-last lg:hidden">
          <LeftSidebar sponsors={sponsors} />
        </div>

        {/* ===== CENTER: BANNERS ===== */}
        <div className="space-y-6 min-w-0">
          {seriesNews.length > 0 ? (
            <MainCarousel
              articles={seriesNews.slice(0, 5)}
              matches={matches}
              getTeamName={getTeamName}
              formatDate={formatDate}
            />
          ) : (
            <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted-bg text-sm text-muted-foreground">
              No hay novedades todavía
            </div>
          )}

          {seriesOptions.map((serie) => ({ serie, news: sortedNews.filter((a) => a.seriesId === serie.id || !a.seriesId).slice(0, 6) }))
            .filter(({ news }) => news.length > 0)
            .map(({ serie, news }) => (
            <div key={serie.id}>
              <SectionTitle>{serie.name}</SectionTitle>
              <ScrollableBanners
                articles={news}
                matches={matches}
                teams={teams}
                getTeamName={getTeamName}
                formatDate={formatDate}
                size="small"
              />
            </div>
          ))}

          {seriesAlbums.length > 0 && (
            <section>
              <SectionTitle
                action={
                  <Link href={`/galeria?serie=${scope.series?.slug ?? ""}`} className="text-sm font-medium text-primary hover:underline">
                    Ver todas
                  </Link>
                }
              >
                Últimas fotos
              </SectionTitle>
              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {seriesAlbums.map((a) => <AlbumCard key={a.id} album={a} sizes="(min-width: 1280px) 15vw, 45vw" />)}
              </div>
            </section>
          )}

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
