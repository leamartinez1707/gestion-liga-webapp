import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { Player, Team } from "@/lib/types"
import { getMatch, getMatches } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { getPlayersByTeam } from "@/lib/db/players"
import { getMatchEvents, getMatchRefereeName } from "@/lib/db/match-events"
import { getGoalsByMatch } from "@/lib/db/goals"
import { getSanctions } from "@/lib/db/sanctions"
import { getAlbums } from "@/lib/db/gallery"
import { getArticles } from "@/lib/db/news"
import { scopeLabel, tournamentLabel } from "@/lib/scope"
import { Button } from "@/components/ui/button"
import { SectionTitle } from "@/components/page-header"
import { PhotoAvatar } from "@/components/photo-avatar"
import { MatchStatusBadge } from "@/components/match-status-badge"
import { AlbumCard } from "@/components/album-card"
import { CoverImage } from "@/components/cover-image"
import { AutoRefresh } from "@/components/auto-refresh"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string): string {
  if (!dateStr) return "Fecha a confirmar"
  const text = new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

type Incident = {
  key: string
  teamId: string
  icon: string
  label: string
  playerId?: string
  assistId?: string
  count?: number
  period?: string
}

// Safety net for edits made directly in Supabase; panel actions revalidate immediately.
export const revalidate = 60

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: match } = await getMatch(id)
  if (!match) notFound()

  const [{ data: teams }, { data: tournaments }, seriesOptions, { data: allMatches }, events, goalsByMatch, { data: sanctions }, { data: albums }, { data: articles }, { data: homePlayers }, { data: awayPlayers }, refereeName] =
    await Promise.all([
      getTeams(),
      getTournaments(),
      getSeriesOptions(),
      getMatches(),
      getMatchEvents(id),
      getGoalsByMatch([id]),
      getSanctions(),
      getAlbums({ matchIds: [id] }),
      getArticles(),
      getPlayersByTeam(match.homeTeamId),
      getPlayersByTeam(match.awayTeamId),
      getMatchRefereeName(id),
    ])

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const home = teamMap.get(match.homeTeamId)
  const away = teamMap.get(match.awayTeamId)
  const tournament = (tournaments ?? []).find((t) => t.id === match.tournamentId)
  const players = new Map<string, Player>([...(homePlayers ?? []), ...(awayPlayers ?? [])].map((p) => [p.id, p]))
  const teamOfPlayer = (playerId: string) => players.get(playerId)?.teamId

  // Incidents: the live sheet when there is one, otherwise what the panel loaded
  const incidents: Incident[] = events.length
    ? events.map((e) => ({
        key: e.id,
        // An own goal counts for the rival: show it on the side it scored for
        teamId: e.type === "own_goal" ? (e.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId) : e.teamId,
        icon: e.type === "yellow" ? "🟨" : e.type === "red" ? "🟥" : "⚽",
        label: e.type === "own_goal" ? "Gol en contra" : e.type === "goal" ? "Gol" : e.type === "yellow" ? "Amarilla" : "Roja",
        playerId: e.playerId,
        assistId: e.assistPlayerId,
        period: e.period,
      }))
    : [
        ...(goalsByMatch.get(id) ?? []).map((g) => ({
          key: `g-${g.playerId}`,
          teamId: teamOfPlayer(g.playerId) ?? "",
          icon: "⚽",
          label: g.goals > 1 ? `${g.goals} goles` : "Gol",
          playerId: g.playerId,
          count: g.goals,
        })),
        ...(sanctions ?? [])
          .filter((s) => s.matchId === id && (s.cardType === "yellow" || s.cardType === "red"))
          .map((s) => ({
            key: `s-${s.id}`,
            teamId: teamOfPlayer(s.playerId) ?? "",
            icon: s.cardType === "red" ? "🟥" : "🟨",
            label: s.cardType === "red" ? "Roja" : "Amarilla",
            playerId: s.playerId,
          })),
      ]

  const playerName = (pid?: string) => (pid ? players.get(pid)?.name ?? "Jugador" : "Sin identificar")

  // Scorers under each team on the scoreboard: "Barán (2), Morales, Pérez (e/c)"
  const scorersOf = (teamId?: string) => {
    const counts = new Map<string, { name: string; goals: number; own: boolean }>()
    for (const i of incidents) {
      if (i.teamId !== teamId || i.icon !== "⚽") continue
      const own = i.label === "Gol en contra"
      const key = `${i.playerId ?? "?"}-${own}`
      const prev = counts.get(key)
      const add = i.count ?? 1
      counts.set(key, { name: playerName(i.playerId), goals: (prev?.goals ?? 0) + add, own })
    }
    return [...counts.values()].map((c) => `${c.name}${c.goals > 1 ? ` (${c.goals})` : ""}${c.own ? " (e/c)" : ""}`)
  }

  // Head-to-head numbers of this match, per team
  const countOf = (teamId: string | undefined, test: (i: Incident) => boolean) => incidents.filter((i) => i.teamId === teamId && test(i)).reduce((n, i) => n + (i.count ?? 1), 0)
  const cardTeam = (i: Incident) => (i.playerId ? teamOfPlayer(i.playerId) ?? i.teamId : i.teamId)
  const cardsOf = (teamId: string | undefined, label: string) => incidents.filter((i) => i.label === label && cardTeam(i) === teamId).length
  const matchStats = [
    { label: "Goles", home: match.homeScore ?? 0, away: match.awayScore ?? 0 },
    { label: "Asistencias", home: countOf(home?.id, (i) => !!i.assistId), away: countOf(away?.id, (i) => !!i.assistId) },
    { label: "Amarillas", home: cardsOf(home?.id, "Amarilla"), away: cardsOf(away?.id, "Amarilla") },
    { label: "Rojas", home: cardsOf(home?.id, "Roja"), away: cardsOf(away?.id, "Roja") },
  ]

  // Previous meetings between both teams (any tournament)
  const headToHead = (allMatches ?? [])
    .filter(
      (m) =>
        m.id !== id &&
        m.status === "finished" &&
        ((m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId) ||
          (m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const news = (articles ?? []).filter((a) => a.matchId === id)
  const album = (albums ?? []).find((a) => a.photoCount > 0)

  const played = match.status === "finished" || match.status === "ongoing"
  const eyebrow = [tournament && scopeLabel(seriesOptions, tournament.seriesId, tournament.divisionId), tournament && tournamentLabel(tournament), `Fecha ${match.matchday}`]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <AutoRefresh active={match.status === "ongoing"} />

      {/* Scoreboard */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background:repeating-linear-gradient(90deg,#fff_0_120px,transparent_120px_240px)]"
        />
        <div className="page-container relative py-7 md:py-10">
          <p className="text-center font-display text-sm font-semibold uppercase tracking-[0.12em] text-accent md:text-base">{eyebrow}</p>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-10">
            <ScoreTeam team={home} scorers={scorersOf(home?.id)} />
            <div className="text-center">
              {played ? (
                <p className="font-display text-6xl font-extrabold leading-none tabular-nums md:text-8xl">
                  {match.homeScore ?? 0}<span className="mx-1 align-middle text-4xl text-white/40 md:mx-3 md:text-6xl">:</span>{match.awayScore ?? 0}
                </p>
              ) : (
                <p className="font-display text-4xl font-bold leading-none md:text-6xl">{match.time ? match.time.slice(0, 5) : "VS"}</p>
              )}
              <div className="mt-3 flex justify-center">
                <MatchStatusBadge match={match} />
              </div>
            </div>
            <ScoreTeam team={away} scorers={scorersOf(away?.id)} />
          </div>
          <p className="mt-6 text-center text-sm text-white/70">
            {formatDate(match.date)}
            {match.time && played && ` · ${match.time.slice(0, 5)} hs`}
            {match.venue && ` · ${match.venue}`}
          </p>
          {refereeName && <p className="mt-1 text-center text-sm text-white/70">Árbitro: <span className="font-semibold text-white">{refereeName}</span></p>}
          {match.notes && <p className="mt-1 text-center text-sm text-white/70">{match.notes}</p>}
        </div>
      </section>

      <div className="page-container py-6 md:py-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6" render={<Link href="/partidos" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al fixture
        </Button>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-start">
          <section className="min-w-0">
            {played && (
              <div className="mb-10">
                <SectionTitle>Estadísticas del partido</SectionTitle>
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  {matchStats.map((s) => {
                    const total = s.home + s.away
                    return (
                      <div key={s.label}>
                        <div className="mb-1 flex items-center justify-between font-display text-lg font-bold tabular-nums">
                          <span>{s.home}</span>
                          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                          <span>{s.away}</span>
                        </div>
                        <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-muted">
                          <div className="flex flex-1 justify-end"><div className="h-full rounded-l-full bg-primary" style={{ width: total ? `${(s.home / total) * 100}%` : "0%" }} /></div>
                          <div className="flex flex-1"><div className="h-full rounded-r-full bg-secondary" style={{ width: total ? `${(s.away / total) * 100}%` : "0%" }} /></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {!events.length && <p className="mt-2 text-xs text-muted-foreground">Resultado cargado desde el panel: las asistencias solo se registran con la planilla del árbitro.</p>}
              </div>
            )}

            <SectionTitle>Incidencias</SectionTitle>
            {incidents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {played ? "No se cargaron goles ni tarjetas de este partido." : "El partido todavía no se jugó."}
              </p>
            ) : (
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card">
                {[home, away].map((team, side) => (
                  <div key={side} className={cn("min-w-0", side === 0 && "border-r border-border")}>
                    <p className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider">
                      <PhotoAvatar src={team?.shield} name={team?.name ?? "—"} className="size-5" fallbackClassName="text-[7px]" />
                      <span className="truncate">{team?.shortName ?? "—"}</span>
                    </p>
                    <ul className="divide-y divide-border">
                      {incidents
                        .filter((i) => i.teamId === team?.id)
                        .map((i) => (
                          <li key={i.key} className="flex items-start gap-2 px-3 py-2.5">
                            <span className="text-base" aria-hidden>{i.icon}</span>
                            <div className="min-w-0">
                              {i.playerId ? (
                                <Link href={`/jugadores/${i.playerId}`} className="block truncate text-sm font-semibold hover:text-primary">
                                  {playerName(i.playerId)}
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-semibold">{playerName(i.playerId)}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {i.label}
                                {i.period && ` · ${i.period}`}
                                {i.assistId && ` · Asist.: ${playerName(i.assistId)}`}
                              </p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {album && (
              <div className="mt-10">
                <SectionTitle>Fotos del partido</SectionTitle>
                <div className="max-w-sm">
                  <AlbumCard album={album} />
                </div>
              </div>
            )}
          </section>

          <aside className="min-w-0 space-y-10">
            {news.length > 0 && (
              <section>
                <SectionTitle>Crónica</SectionTitle>
                <ul className="space-y-3">
                  {news.map((a) => (
                    <li key={a.id}>
                      <Link href={`/actualidad/${a.id}`} className="group flex gap-3 overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
                        <div className="relative aspect-[4/3] w-32 shrink-0 bg-muted">
                          <CoverImage src={a.imageUrl} alt={a.title} sizes="128px" />
                        </div>
                        <div className="min-w-0 py-3 pr-3">
                          <p className="font-display text-lg font-bold uppercase leading-tight group-hover:text-primary">{a.title}</p>
                          {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <SectionTitle>Historial entre ambos</SectionTitle>
              {headToHead.length === 0 ? (
                <p className="text-sm text-muted-foreground">Es el primer cruce cargado entre estos equipos.</p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {headToHead.map((m) => (
                    <li key={m.id}>
                      <Link href={`/partidos/${m.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted">
                        <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{m.date ? new Date(m.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}</span>
                        <span className="flex-1 truncate text-right font-semibold">{teamMap.get(m.homeTeamId)?.shortName}</span>
                        <span className="shrink-0 font-display text-lg font-bold tabular-nums">{m.homeScore ?? 0}-{m.awayScore ?? 0}</span>
                        <span className="flex-1 truncate font-semibold">{teamMap.get(m.awayTeamId)?.shortName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}

function ScoreTeam({ team, scorers }: { team?: Team; scorers: string[] }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {team ? (
        <Link href={`/equipos/${team.id}`} className="flex flex-col items-center gap-2 hover:opacity-90">
          <PhotoAvatar src={team.shield} name={team.name} className="size-16 bg-white md:size-24" fallbackClassName="text-lg md:text-2xl" />
          <span className="font-display text-xl font-bold uppercase leading-tight md:text-3xl">{team.name}</span>
        </Link>
      ) : (
        <span className="font-display text-xl font-bold uppercase">—</span>
      )}
      {scorers.length > 0 && (
        <ul className="space-y-0.5 text-xs text-white/75 md:text-sm">
          {scorers.map((s) => <li key={s}>⚽ {s}</li>)}
        </ul>
      )}
    </div>
  )
}
