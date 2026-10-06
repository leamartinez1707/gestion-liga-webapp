import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { Player } from "@/lib/types"
import { getTeam, getTeamsByIds } from "@/lib/db/teams"
import { getPlayersByIds, getPlayersByTeam } from "@/lib/db/players"
import { getTopScorers } from "@/lib/db/goals"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getMatches, getNextMatchdays } from "@/lib/db/matches"
import { getAlbums } from "@/lib/db/gallery"
import { getSanctions } from "@/lib/db/sanctions"
import { getTeamSeasonPhotos } from "@/lib/db/team-photos"
import { getAssistCounts } from "@/lib/db/player-stats"
import { getAppearanceCounts } from "@/lib/db/lineups"
import { activeSuspensions, sanctionTournamentIds } from "@/lib/suspensions"
import { outcomeFor, percent, teamRecord } from "@/lib/team-stats"
import { AlbumCard } from "@/components/album-card"
import { resolveScope, scopeLabel, scopeQuery } from "@/lib/scope"
import { Button } from "@/components/ui/button"
import { PageHeader, SectionTitle } from "@/components/page-header"
import { PhotoAvatar } from "@/components/photo-avatar"
import { CoverImage } from "@/components/cover-image"
import { cn } from "@/lib/utils"

const positionLabels: Record<string, string> = {
  arquero: "Arquero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
}

const OUTCOME_STYLE = { G: "bg-success", E: "bg-amber-500", P: "bg-destructive" } as const

export default async function EquipoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ serie?: string; div?: string; temporada?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  const { data: team, error: teamError } = await getTeam(id)
  if (teamError || !team) notFound()

  const [{ data: players }, seriesOptions, { data: tournaments }, { data: registrations }, { data: matches }, { data: sanctions }, seasonPhotos] =
    await Promise.all([
      getPlayersByTeam(id),
      getSeriesOptions(),
      getTournaments(),
      getRegistrations({ teamId: id }),
      // Only this team's matches (home or away), not the whole fixture
      getMatches({ teamId: id }),
      getSanctions({ teamId: id }),
      getTeamSeasonPhotos(id),
    ])

  const tournamentMap = new Map((tournaments ?? []).map((t) => [t.id, t]))
  const teamMatches = matches ?? []

  // Seasons: the tournaments the club played plus the years with a squad photo
  const registeredIds = new Set((registrations ?? []).map((r) => r.tournamentId))
  const teamTournaments = (tournaments ?? []).filter((t) => registeredIds.has(t.id))
  const seasons = [...new Set([...teamTournaments.map((t) => t.season), ...seasonPhotos.map((p) => p.season)])].sort((a, b) =>
    b.localeCompare(a)
  )
  const latestSeason = seasons[0]
  const season = seasons.includes(query.temporada ?? "") ? query.temporada! : latestSeason
  const seasonTournaments = teamTournaments.filter((t) => t.season === season)
  const seasonTournamentIds = new Set(seasonTournaments.map((t) => t.id))

  // ---- All-time record in the league ----
  const record = teamRecord(teamMatches, id)
  const playerIdsOfTeam = new Set((players ?? []).map((p) => p.id))
  const teamMatchIds = new Set(teamMatches.map((m) => m.id))
  const cards = (sanctions ?? []).filter((s) => playerIdsOfTeam.has(s.playerId) && s.matchId && teamMatchIds.has(s.matchId))
  const yellows = cards.filter((s) => s.cardType === "yellow").length
  const reds = cards.filter((s) => s.cardType === "red").length

  // ---- Selected season ----
  const seasonMatches = teamMatches
    .filter((m) => seasonTournamentIds.has(m.tournamentId))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const seasonPhoto = seasonPhotos.find((p) => p.season === season)

  // Squad: that season's lista de buena fe; the current season falls back to the active players
  const seasonRegistrationIds = (registrations ?? []).filter((r) => seasonTournamentIds.has(r.tournamentId)).map((r) => r.id)
  const { data: rosters } = await getRosters(seasonRegistrationIds)
  const rosterIds = [...new Set([...rosters.values()].flat())]
  let squad: Player[] = rosterIds.length ? await getPlayersByIds(rosterIds) : []
  if (squad.length === 0 && season === latestSeason) squad = (players ?? []).filter((p) => p.active)
  squad = [...squad].sort((a, b) => (a.number || 999) - (b.number || 999))

  const seasonMatchIds = new Set(seasonMatches.map((m) => m.id))
  const [{ data: scorers }, { data: albums }, assistsByPlayer, playedByPlayer, { data: teams }, nextMatchdays] = await Promise.all([
    getTopScorers(100, { teamIds: [id], tournamentIds: [...seasonTournamentIds] }),
    getAlbums({ matchIds: [...seasonMatchIds] }),
    getAssistCounts([...seasonMatchIds]),
    getAppearanceCounts([...seasonMatchIds]),
    getTeamsByIds(seasonMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId])),
    getNextMatchdays(sanctionTournamentIds(sanctions ?? [])),
  ])
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const goalsByPlayer = new Map((scorers ?? []).map((s) => [s.playerId, s.goals]))
  // Cards of the season, per player
  const seasonCards = new Map<string, { yellow: number; red: number }>()
  for (const s of sanctions ?? []) {
    if (!s.matchId || !seasonMatchIds.has(s.matchId) || (s.cardType !== "yellow" && s.cardType !== "red")) continue
    const c = seasonCards.get(s.playerId) ?? { yellow: 0, red: 0 }
    c[s.cardType] += 1
    seasonCards.set(s.playerId, c)
  }

  // Titles: tournaments the club won
  const titles = (tournaments ?? [])
    .filter((t) => t.championTeamId === id)
    .sort((a, b) => b.season.localeCompare(a.season))
  const suspended = activeSuspensions(sanctions ?? [], nextMatchdays)
  const seasonAlbums = (albums ?? []).filter((a) => a.photoCount > 0).slice(0, 8)

  // Back to where the visitor came from, or to the team's first division
  const first = seasonTournaments[0] ?? teamTournaments[0]
  const backScope = query.serie
    ? resolveScope(seriesOptions, query.serie, query.div)
    : resolveScope(
        seriesOptions,
        seriesOptions.find((s) => s.id === first?.seriesId)?.slug,
        seriesOptions.flatMap((s) => s.divisions).find((d) => d.id === first?.divisionId)?.slug
      )
  const backHref = `/equipos${scopeQuery(backScope)}`
  const keep = query.serie ? scopeQuery(backScope) : ""
  const seasonHref = (s: string) => `/equipos/${id}${scopeQuery(backScope, { temporada: s })}`

  const statRows = [
    { label: "🏆", value: titles.length, tone: "bg-amber-100" },
    { label: "PJ", value: record.played, tone: "bg-primary" },
    { label: "PG", value: record.won, pct: percent(record.won, record.played), tone: "bg-success" },
    { label: "PE", value: record.drawn, pct: percent(record.drawn, record.played), tone: "bg-amber-500" },
    { label: "PP", value: record.lost, pct: percent(record.lost, record.played), tone: "bg-destructive" },
    { label: "GF", value: record.goalsFor, tone: "bg-success" },
    { label: "GC", value: record.goalsAgainst, tone: "bg-destructive" },
    { label: "🟨", value: yellows, tone: "bg-muted" },
    { label: "🟥", value: reds, tone: "bg-muted" },
  ]

  return (
    <>
      <PageHeader
        eyebrow={seasonTournaments.map((t) => scopeLabel(seriesOptions, t.seriesId, t.divisionId)).join(" / ")}
        title={team.name}
        subtitle={[team.coach && `DT: ${team.coach}`, team.assistantCoach && `Asistente: ${team.assistantCoach}`].filter(Boolean).join(" · ")}
        media={<PhotoAvatar src={team.shield} name={team.name} className="size-16 bg-white md:size-24" fallbackClassName="text-xl md:text-2xl" />}
      >
        {seasons.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {seasons.map((s) => (
              <Link
                key={s}
                href={seasonHref(s)}
                scroll={false}
                className={cn(
                  "rounded-md px-3.5 py-1.5 font-display text-lg font-semibold tabular-nums transition-colors",
                  s === season ? "bg-white text-primary" : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {s}
              </Link>
            ))}
          </div>
        )}
      </PageHeader>

      <div className="page-container py-6 md:py-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6" render={<Link href={backHref} />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a equipos
        </Button>

        {/* All-time record */}
        <section>
          <SectionTitle>Estadísticas en la liga</SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9 md:gap-3">
            {statRows.map((s) => (
              <div key={s.label} className="overflow-hidden rounded-xl border border-border bg-card text-center">
                <p className={cn("py-1 font-display text-sm font-bold uppercase tracking-wider", s.tone, s.tone.startsWith("bg-muted") || s.tone.startsWith("bg-amber-100") ? "" : "text-white")}>
                  {s.label}
                </p>
                <p className="py-2 font-display text-3xl font-bold tabular-nums leading-none md:text-4xl">{s.value}</p>
                {s.pct !== undefined && <p className="pb-2 text-xs text-muted-foreground">{s.pct}%</p>}
              </div>
            ))}
          </div>
          {titles.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {titles.map((t) => (
                <li key={t.id} className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                  <span aria-hidden>🏆</span>
                  {t.name} · {scopeLabel(seriesOptions, t.seriesId, t.divisionId)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Selected season */}
        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-start">
          <section className="min-w-0">
            <SectionTitle action={season && <span className="font-display text-xl font-bold">{season}</span>}>Plantel</SectionTitle>

            {seasonPhoto && (
              <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                <CoverImage src={seasonPhoto.url} alt={`Plantel ${team.name} ${season}`} sizes="(min-width: 1280px) 55vw, 100vw" priority />
              </div>
            )}

            {squad.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No hay lista de buena fe cargada para {season}.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_repeat(5,2.1rem)] items-center gap-x-1 border-b border-border bg-muted py-2 pr-2 text-center font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground md:grid-cols-[3rem_minmax(0,1fr)_repeat(5,3rem)]">
                  <span>#</span>
                  <span className="pl-3 text-left">Jugador</span>
                  <span title="Partidos jugados">PJ</span>
                  <span title="Goles">⚽</span>
                  <span title="Asistencias">👟</span>
                  <span title="Amarillas">🟨</span>
                  <span title="Rojas">🟥</span>
                </div>
                <ul className="divide-y divide-border">
                  {squad.map((player) => {
                    const cards = seasonCards.get(player.id)
                    const suspendedUntil = season === latestSeason ? suspended.get(player.id)?.untilMatchday : undefined
                    const cell = (n: number) => (
                      <span className={cn("text-center font-display text-lg font-bold tabular-nums", n === 0 && "text-muted-foreground/50")}>{n}</span>
                    )
                    return (
                      <li key={player.id}>
                        <Link
                          href={`/jugadores/${player.id}${keep}`}
                          className="grid grid-cols-[3rem_minmax(0,1fr)_repeat(5,2.1rem)] items-center gap-x-1 pr-2 transition hover:bg-muted md:grid-cols-[3rem_minmax(0,1fr)_repeat(5,3rem)]"
                        >
                          <span className="flex items-center justify-center self-stretch bg-primary font-display text-xl font-bold text-white tabular-nums">
                            {player.number > 0 ? player.number : "–"}
                          </span>
                          <span className="flex min-w-0 items-center gap-2.5 py-2 pl-3">
                            <PhotoAvatar src={player.photo} name={player.name} className="size-9 shrink-0" fallbackClassName="text-xs" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{player.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {positionLabels[player.position] ?? player.position}
                                {suspendedUntil !== undefined && (
                                  <span className="ml-1.5 font-semibold text-destructive">· Suspendido hasta la fecha {suspendedUntil}</span>
                                )}
                              </span>
                            </span>
                          </span>
                          {cell(playedByPlayer.get(player.id) ?? 0)}
                          {cell(goalsByPlayer.get(player.id) ?? 0)}
                          {cell(assistsByPlayer.get(player.id) ?? 0)}
                          {cell(cards?.yellow ?? 0)}
                          {cell(cards?.red ?? 0)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          <section className="min-w-0">
            <SectionTitle action={season && <span className="font-display text-xl font-bold">{season}</span>}>Resultados</SectionTitle>
            {seasonMatches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Sin partidos en {season}.</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {seasonMatches.map((m) => {
                  const outcome = outcomeFor(m, id)
                  const played = m.status === "finished" || m.status === "ongoing"
                  const homeTeam = teamMap.get(m.homeTeamId)
                  const awayTeam = teamMap.get(m.awayTeamId)
                  const tournament = tournamentMap.get(m.tournamentId)
                  return (
                    <li key={m.id}>
                      <Link href={`/partidos/${m.id}`} className="flex items-center gap-2 px-3 py-2.5 transition hover:bg-muted md:gap-3">
                        <span
                          aria-label={outcome === "G" ? "Ganado" : outcome === "P" ? "Perdido" : outcome === "E" ? "Empatado" : "Sin jugar"}
                          className={cn("size-3.5 shrink-0 rounded-sm", outcome ? OUTCOME_STYLE[outcome] : "border border-border")}
                        />
                        <span className="w-[4.5rem] shrink-0 leading-tight md:w-24" title={tournament?.name}>
                          <span className="block text-xs font-medium tabular-nums">
                            {m.date ? new Date(m.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "A confirmar"}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">Fecha {m.matchday}</span>
                        </span>
                        <span className={cn("min-w-0 flex-1 truncate text-right text-sm", m.homeTeamId === id ? "font-bold" : "font-medium")}>
                          {homeTeam?.shortName ?? "—"}
                        </span>
                        <span className="w-16 shrink-0 text-center font-display text-lg font-bold tabular-nums">
                          {played ? `${m.homeScore ?? 0} - ${m.awayScore ?? 0}` : m.time ? m.time.slice(0, 5) : "vs"}
                        </span>
                        <span className={cn("min-w-0 flex-1 truncate text-sm", m.awayTeamId === id ? "font-bold" : "font-medium")}>
                          {awayTeam?.shortName ?? "—"}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {seasonAlbums.length > 0 && (
          <section className="mt-12">
            <SectionTitle>Fotos {season}</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {seasonAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
