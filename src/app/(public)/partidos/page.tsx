import Link from "next/link"

import type { Team } from "@/lib/types"
import { getMatches } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { calculateStandings } from "@/lib/db/standings"
import { getRegistrations } from "@/lib/db/registrations"
import { resolveScope, scopeQuery, teamsInTournament, tournamentLabel, tournamentsInScope, withdrawnInTournament } from "@/lib/scope"
import { StandingsTable } from "@/components/standings-table"
import { PhotoAvatar } from "@/components/photo-avatar"
import { MatchStatusBadge } from "@/components/match-status-badge"
import { AutoRefresh } from "@/components/auto-refresh"
import { PageHeader, SectionTitle } from "@/components/page-header"
import { cn } from "@/lib/utils"

function formatDay(dateStr: string): string {
  if (!dateStr) return "A confirmar"
  const date = new Date(dateStr + "T00:00:00")
  const text = date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function TeamCell({ team, href, align }: { team?: Team; href?: string; align: "home" | "away" }) {
  return (
    <Link
      href={href ?? "#"}
      className={cn(
        "flex min-w-0 items-center gap-2 hover:text-primary md:gap-2.5",
        align === "home" ? "flex-row-reverse text-right" : "text-left"
      )}
    >
      <PhotoAvatar src={team?.shield} name={team?.name ?? "—"} className="size-7 shrink-0 md:size-9" fallbackClassName="text-[10px]" />
      <span className="min-w-0 text-sm font-semibold leading-tight md:truncate md:text-base">
        <span className="md:hidden">{team?.shortName ?? "—"}</span>
        <span className="hidden md:inline">{team?.name ?? "—"}</span>
      </span>
    </Link>
  )
}

function ScoreBox({ value, live }: { value?: number; live?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-md font-display text-xl font-bold tabular-nums md:size-10 md:text-2xl",
        live ? "bg-secondary text-white" : "bg-primary text-white"
      )}
    >
      {value ?? 0}
    </span>
  )
}

interface Props { searchParams: Promise<{ serie?: string; div?: string; torneo?: string; fecha?: string }> }

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const fechaParam = parseInt(params.fecha ?? "0")

  const [{ data: matches, error }, { data: teams }, { data: tournaments }, seriesOptions, { data: registrations }] =
    await Promise.all([getMatches(), getTeams(), getTournaments(), getSeriesOptions(), getRegistrations()])

  if (error) return <div className="page-container py-16 text-center"><p className="text-destructive">{error}</p></div>

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
    teamsInTournament(teamsList, registrations ?? [], selectedTorneo?.id),
    withdrawnInTournament(registrations ?? [], selectedTorneo?.id)
  )

  // Group by matchday; default to the next matchday still to be played
  const matchdays = [...new Set(matchesList.map((m) => m.matchday))].sort((a, b) => a - b)
  const nextMatchday = matchdays.find((md) =>
    matchesList.some((m) => m.matchday === md && (m.status === "scheduled" || m.status === "ongoing"))
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
  const teamHref = (team?: Team) => team && `/equipos/${team.id}${scopeQuery(scope)}`

  // Teams of the tournament that don't play this matchday (odd number of teams)
  const playing = new Set(currentMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))
  const withdrawn = withdrawnInTournament(registrations ?? [], selectedTorneo?.id)
  const restTeams = currentMatches.length
    ? teamsInTournament(teamsList, registrations ?? [], selectedTorneo?.id).filter((t) => !playing.has(t.id) && !withdrawn.has(t.id))
    : []

  return (
    <>
      <AutoRefresh active={currentMatches.some((m) => m.status === "ongoing")} />
      <PageHeader eyebrow={scopeName} title="Fixture y posiciones" subtitle={selectedTorneo && tournamentLabel(selectedTorneo)}>
        {divisionTournaments.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {divisionTournaments.map((t) => (
              <Link
                key={t.id}
                href={buildUrl({ torneo: t.id })}
                className={cn(
                  "rounded-md px-3.5 py-1.5 font-display text-base font-semibold uppercase tracking-wide transition-colors",
                  selectedTorneo?.id === t.id ? "bg-white text-primary" : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </PageHeader>

      <div className="page-container grid gap-10 py-8 md:py-10 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] 2xl:items-start">
        {/* FIXTURE */}
        <section className="min-w-0">
          <SectionTitle>Fixture</SectionTitle>

          {matchdays.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fecha</span>
              {matchdays.map((md) => (
                <Link
                  key={md}
                  href={buildUrl({ torneo: selectedTorneo?.id ?? "", fecha: String(md) })}
                  aria-label={`Fecha ${md}`}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 font-display text-lg font-bold transition-colors",
                    selectedFecha === md
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {md}
                </Link>
              ))}
            </div>
          )}

          {currentMatches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
              No hay partidos cargados para esta división todavía.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {/* Column headers (desktop) */}
              <div className="hidden grid-cols-[76px_minmax(0,1fr)_92px_minmax(0,1fr)_minmax(0,140px)] gap-3 border-b border-border bg-muted px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                <span>Día</span>
                <span className="text-right">Local</span>
                <span className="text-center">Resultado</span>
                <span>Visitante</span>
                <span className="text-right">Cancha</span>
              </div>
              <ul className="divide-y divide-border">
                {currentMatches.map((m) => {
                  const home = teamMap.get(m.homeTeamId)
                  const away = teamMap.get(m.awayTeamId)
                  const played = m.status === "finished" || m.status === "ongoing"
                  const when = `${formatDay(m.date)}${m.time ? ` · ${m.time.slice(0, 5)}` : ""}`
                  return (
                    <li key={m.id} className="px-3 py-3 even:bg-muted/40 md:px-4">
                      {/* Mobile meta line */}
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground md:hidden">
                        <span className="truncate">{when}{m.venue && ` · ${m.venue}`}</span>
                        {m.status !== "scheduled" && <MatchStatusBadge match={m} />}
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-2 md:gap-3 md:grid-cols-[76px_minmax(0,1fr)_92px_minmax(0,1fr)_minmax(0,140px)]">
                        <span className="hidden flex-col leading-tight md:flex">
                          <span className="text-xs text-muted-foreground">{formatDay(m.date)}</span>
                          {m.time && <span className="font-display text-lg font-bold tabular-nums">{m.time.slice(0, 5)}</span>}
                        </span>
                        <TeamCell team={home} href={teamHref(home)} align="home" />
                        <div className="flex items-center justify-center gap-1.5">
                          {played ? (
                            <>
                              <ScoreBox value={m.homeScore} live={m.status === "ongoing"} />
                              <ScoreBox value={m.awayScore} live={m.status === "ongoing"} />
                            </>
                          ) : (
                            <span className="rounded-md border border-border px-2.5 py-1 font-display text-lg font-bold tabular-nums">
                              {m.status === "scheduled" ? (m.time ? m.time.slice(0, 5) : "VS") : <MatchStatusBadge match={m} />}
                            </span>
                          )}
                        </div>
                        <TeamCell team={away} href={teamHref(away)} align="away" />
                        <div className="hidden flex-col items-end gap-1 text-right text-xs text-muted-foreground md:flex">
                          <span className="truncate">{m.venue || "A confirmar"}</span>
                          {m.status !== "scheduled" && <MatchStatusBadge match={m} />}
                        </div>
                      </div>
                      {m.notes && <p className="mt-2 text-center text-xs text-muted-foreground">{m.notes}</p>}
                    </li>
                  )
                })}
              </ul>
              {restTeams.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted px-4 py-3 text-sm">
                  <span className="font-display font-semibold uppercase tracking-wider text-muted-foreground">Fecha libre</span>
                  {restTeams.map((t) => (
                    <Link key={t.id} href={teamHref(t) ?? "#"} className="flex items-center gap-2 font-semibold hover:text-primary">
                      <PhotoAvatar src={t.shield} name={t.name} className="size-7" fallbackClassName="text-[10px]" />
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* STANDINGS */}
        <section className="min-w-0">
          <SectionTitle>Posiciones</SectionTitle>
          <div className="overflow-x-auto">
            <StandingsTable standings={standings} />
          </div>
        </section>
      </div>
    </>
  )
}
