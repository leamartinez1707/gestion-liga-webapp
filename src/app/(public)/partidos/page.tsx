import Link from "next/link"

import type { Team } from "@/lib/types"
import { getMatches } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { calculateStandings } from "@/lib/db/standings"
import { getRegistrations } from "@/lib/db/registrations"
import { resolveScope, scopeQuery, teamsInTournament, tournamentsInScope } from "@/lib/scope"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StandingsTable } from "@/components/standings-table"
import { PhotoAvatar } from "@/components/photo-avatar"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string): string {
  if (!dateStr) return "Fecha a confirmar"
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

function TeamSide({ team, score, href }: { team?: Team; score?: number; href?: string }) {
  return (
    <Link
      href={href ?? "#"}
      className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 bg-muted-bg/30 hover:bg-muted-bg/60 transition-colors"
    >
      <PhotoAvatar src={team?.shield} name={team?.name ?? "—"} className="size-10" />
      <p className="font-bold text-sm text-center leading-tight">{team?.shortName ?? "—"}</p>
      {score != null && <span className="text-2xl font-black tabular-nums text-foreground">{score}</span>}
    </Link>
  )
}

interface Props { searchParams: Promise<{ serie?: string; div?: string; torneo?: string; fecha?: string }> }

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const fechaParam = parseInt(params.fecha ?? "0")

  const [{ data: matches, error }, { data: teams }, { data: tournaments }, seriesOptions, { data: registrations }] =
    await Promise.all([getMatches(), getTeams(), getTournaments(), getSeriesOptions(), getRegistrations()])

  if (error) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-destructive">{error}</p></div>

  const scope = resolveScope(seriesOptions, params.serie, params.div)
  const teamsList = teams ?? []
  const teamMap = new Map(teamsList.map((t) => [t.id, t]))

  // Tournaments of the selected division (latest first)
  const divisionTournaments = tournamentsInScope(tournaments ?? [], scope)
  const selectedTorneo =
    divisionTournaments.find((t) => t.id === params.torneo) ?? divisionTournaments[0]

  const matchesList = (matches ?? []).filter((m) => m.tournamentId === selectedTorneo?.id)
  const standings = calculateStandings(
    matchesList,
    teamsInTournament(teamsList, registrations ?? [], selectedTorneo?.id)
  )

  // Group by matchday; default to the next matchday still to be played
  const matchdays = [...new Set(matchesList.map((m) => m.matchday))].sort((a, b) => a - b)
  const nextMatchday = matchdays.find((md) =>
    matchesList.some((m) => m.matchday === md && m.status !== "finished")
  )
  const selectedFecha =
    fechaParam > 0 && matchdays.includes(fechaParam)
      ? fechaParam
      : nextMatchday ?? matchdays[matchdays.length - 1] ?? 0

  const currentMatches = matchesList
    .filter((m) => m.matchday === selectedFecha)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const scopeName = [scope.series?.name, scope.division?.name].filter(Boolean).join(" · ")

  const buildUrl = (extra: Record<string, string>) => `/partidos${scopeQuery(scope, extra)}`

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      {/* TITLE */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Partidos
          {scopeName && <span className="text-primary"> · {scopeName}</span>}
        </h1>
        {selectedTorneo && (
          <p className="mt-2 text-muted-foreground text-sm">
            {selectedTorneo.name} · Temporada {selectedTorneo.season}
          </p>
        )}
      </div>

      {/* TOURNAMENT SELECTOR */}
      {divisionTournaments.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {divisionTournaments.map((t) => (
            <Link
              key={t.id}
              href={buildUrl({ torneo: t.id })}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedTorneo?.id === t.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-muted-bg text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-start">
        {/* FIXTURE */}
        <section>
          <h2 className="text-lg font-bold mb-4">Fixture</h2>

          {matchdays.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {matchdays.map((md) => (
                <Link
                  key={md}
                  href={buildUrl({ torneo: selectedTorneo?.id ?? "", fecha: String(md) })}
                  aria-label={`Fecha ${md}`}
                  className={cn(
                    "min-w-[44px] h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all",
                    selectedFecha === md
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted-bg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {md}
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {currentMatches.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No hay partidos cargados para esta división todavía.
              </p>
            )}
            {currentMatches.map((m) => {
              const home = teamMap.get(m.homeTeamId)
              const away = teamMap.get(m.awayTeamId)
              const finished = m.status === "finished"
              return (
                <Card key={m.id} className="border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <TeamSide team={home} score={finished ? m.homeScore : undefined} href={home && `/equipos/${home.id}${scopeQuery(scope)}`} />
                      <div className="flex flex-col items-center justify-center px-3 py-3 border-x border-border bg-background min-w-[76px]">
                        {finished ? (
                          <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success-soft">FINAL</Badge>
                        ) : m.status === "ongoing" ? (
                          <Badge variant="outline" className="text-[10px]">EN JUEGO</Badge>
                        ) : (
                          <span className="text-sm font-bold tabular-nums">{m.time ? `${m.time.slice(0, 5)} hs` : "VS"}</span>
                        )}
                      </div>
                      <TeamSide team={away} score={finished ? m.awayScore : undefined} href={away && `/equipos/${away.id}${scopeQuery(scope)}`} />
                    </div>
                    <div className="text-center py-2 bg-muted-bg/50 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(m.date)}
                        {m.venue && ` · ${m.venue}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* STANDINGS */}
        <section>
          <h2 className="text-lg font-bold mb-4">Tabla de posiciones</h2>
          <div className="overflow-x-auto">
            <StandingsTable standings={standings} />
          </div>
        </section>
      </div>
    </div>
  )
}
