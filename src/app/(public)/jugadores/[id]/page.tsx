import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getPlayer } from "@/lib/db/players"
import { getTeam, getTeams } from "@/lib/db/teams"
import { getMatches } from "@/lib/db/matches"
import { getTournaments } from "@/lib/db/tournaments"
import { getSanctions } from "@/lib/db/sanctions"
import { getSeriesOptions } from "@/lib/db/series"
import { getPlayerMatchLines } from "@/lib/db/player-stats"
import { activeSuspensions } from "@/lib/suspensions"
import { resolveScope, scopeQuery, tournamentLabel } from "@/lib/scope"
import { Button } from "@/components/ui/button"
import { PageHeader, SectionTitle } from "@/components/page-header"
import { PhotoAvatar } from "@/components/photo-avatar"
import { cn } from "@/lib/utils"

const POSITIONS: Record<string, string> = {
  arquero: "Arquero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
}

function formatDay(dateStr: string): string {
  if (!dateStr) return "A confirmar"
  const text = new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Safety net for edits made directly in Supabase; panel actions revalidate immediately.
export const revalidate = 300

export default async function JugadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ serie?: string; div?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  const { data: player } = await getPlayer(id)
  if (!player) notFound()

  const [{ data: team }, { data: teams }, { data: matches }, { data: tournaments }, { data: sanctions }, seriesOptions, lines] =
    await Promise.all([
      getTeam(player.teamId),
      getTeams(),
      getMatches(),
      getTournaments(),
      getSanctions(),
      getSeriesOptions(),
      getPlayerMatchLines(id),
    ])

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]))
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const tournamentMap = new Map((tournaments ?? []).map((t) => [t.id, t]))

  // Matches where the player scored, assisted or was booked, newest first
  const rows = lines
    .map((l) => ({ ...l, match: matchMap.get(l.matchId) }))
    .filter((r) => r.match)
    .sort((a, b) => (b.match!.date + b.match!.time).localeCompare(a.match!.date + a.match!.time))

  // Totals of the latest season the player has activity in
  const seasonOf = (tournamentId?: string) => (tournamentId ? tournamentMap.get(tournamentId)?.season : undefined)
  const season = rows.map((r) => seasonOf(r.match!.tournamentId)).find(Boolean)
  const seasonRows = season ? rows.filter((r) => seasonOf(r.match!.tournamentId) === season) : rows
  const totals = seasonRows.reduce(
    (t, r) => ({ goals: t.goals + r.goals, assists: t.assists + r.assists, yellow: t.yellow + r.yellow, red: t.red + r.red }),
    { goals: 0, assists: 0, yellow: 0, red: 0 }
  )

  const suspension = activeSuspensions((sanctions ?? []).filter((s) => s.playerId === id), matches ?? []).get(id)

  const scope = resolveScope(seriesOptions, query.serie, query.div)
  const q = query.serie ? scopeQuery(scope) : ""
  const teamHref = `/equipos/${player.teamId}${q}`

  const stats = [
    { label: "Goles", value: totals.goals, icon: "⚽" },
    { label: "Asistencias", value: totals.assists, icon: "👟" },
    { label: "Amarillas", value: totals.yellow, icon: "🟨" },
    { label: "Rojas", value: totals.red, icon: "🟥" },
  ]

  return (
    <>
      <PageHeader
        eyebrow={team?.name}
        title={player.name}
        subtitle={[player.number > 0 && `#${player.number}`, POSITIONS[player.position]].filter(Boolean).join(" · ")}
        media={
          <div className="relative">
            <PhotoAvatar src={player.photo} name={player.name} className="size-20 bg-white md:size-28" fallbackClassName="text-xl md:text-3xl" />
            {team && (
              <PhotoAvatar
                src={team.shield}
                name={team.name}
                className="absolute -bottom-1 -right-1 size-8 border-2 border-primary bg-white md:size-10"
                fallbackClassName="text-[9px]"
              />
            )}
          </div>
        }
      />

      <div className="page-container py-6 md:py-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6" render={<Link href={teamHref} />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a {team?.shortName ?? "equipo"}
        </Button>

        {suspension && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive">
            Suspendido · vuelve a jugar en la fecha {suspension.untilMatchday + 1}
          </div>
        )}

        <SectionTitle action={season && <span className="text-sm text-muted-foreground">Temporada {season}</span>}>
          Estadísticas
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </p>
              <p className="mt-1 font-display text-5xl font-bold tabular-nums leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <SectionTitle>Partidos</SectionTitle>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Todavía no tiene goles, asistencias ni tarjetas cargados.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {rows.map(({ match, goals, assists, yellow, red }) => {
                const m = match!
                const isHome = m.homeTeamId === player.teamId
                const rival = teamMap.get(isHome ? m.awayTeamId : m.homeTeamId)
                const own = isHome ? m.homeScore : m.awayScore
                const other = isHome ? m.awayScore : m.homeScore
                const played = m.status === "finished" || m.status === "ongoing"
                const outcome = !played || own == null || other == null ? null : own > other ? "G" : own < other ? "P" : "E"
                const tournament = tournamentMap.get(m.tournamentId)
                return (
                  <li key={m.id}>
                    <Link href={`/partidos/${m.id}`} className="flex items-center gap-2 px-3 py-3 transition hover:bg-muted md:gap-3 md:px-4">
                    <div className="w-[4.5rem] shrink-0 text-xs text-muted-foreground md:w-32">
                      <p className="truncate">{formatDay(m.date)}</p>
                      <p className="truncate">
                        F{m.matchday}
                        {tournament && <span className="hidden md:inline"> · {tournamentLabel(tournament)}</span>}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="shrink-0 rounded border border-border px-1 font-display text-xs font-semibold text-muted-foreground" title={isHome ? "Local" : "Visitante"}>
                        {isHome ? "L" : "V"}
                      </span>
                      <PhotoAvatar src={rival?.shield} name={rival?.name ?? "—"} className="size-7 shrink-0" fallbackClassName="text-[9px]" />
                      <span className="truncate font-semibold">{rival?.shortName ?? "—"}</span>
                    </div>
                    {played && (
                      <span className="flex shrink-0 items-center gap-1.5">
                        {outcome && (
                          <span
                            className={cn(
                              "flex size-6 items-center justify-center rounded font-display text-sm font-bold text-white",
                              outcome === "G" ? "bg-success" : outcome === "P" ? "bg-destructive" : "bg-muted-foreground"
                            )}
                          >
                            {outcome}
                          </span>
                        )}
                        <span className="font-display text-xl font-bold tabular-nums">{own ?? 0}-{other ?? 0}</span>
                      </span>
                    )}
                    <span className="flex shrink-0 flex-wrap justify-end gap-x-2 text-sm md:w-36" aria-label="Participación">
                      {goals > 0 && <span title="Goles">⚽{goals > 1 && <b className="ml-0.5">{goals}</b>}</span>}
                      {assists > 0 && <span title="Asistencias">👟{assists > 1 && <b className="ml-0.5">{assists}</b>}</span>}
                      {yellow > 0 && <span title="Amarilla">🟨{yellow > 1 && <b className="ml-0.5">{yellow}</b>}</span>}
                      {red > 0 && <span title="Roja">🟥</span>}
                    </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Se muestran los partidos en los que tuvo goles, asistencias o tarjetas. Las asistencias salen de la planilla del árbitro.
          </p>
        </section>
      </div>
    </>
  )
}
