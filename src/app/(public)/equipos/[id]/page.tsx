import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getTeam } from "@/lib/db/teams"
import { getPlayersByTeam } from "@/lib/db/players"
import { getTopScorers } from "@/lib/db/goals"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations } from "@/lib/db/registrations"
import { getMatches } from "@/lib/db/matches"
import { getAlbums } from "@/lib/db/gallery"
import { getSanctions } from "@/lib/db/sanctions"
import { activeSuspensions } from "@/lib/suspensions"
import { AlbumCard } from "@/components/album-card"
import { resolveScope, scopeLabel, scopeQuery } from "@/lib/scope"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhotoAvatar } from "@/components/photo-avatar"

const positionLabels: Record<string, string> = {
  arquero: "Arquero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
}

export default async function EquipoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ serie?: string; div?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  const { data: team, error: teamError } = await getTeam(id)
  if (teamError || !team) notFound()

  const [{ data: players }, seriesOptions, { data: tournaments }, { data: registrations }, { data: matches }] = await Promise.all([
    getPlayersByTeam(id),
    getSeriesOptions(),
    getTournaments(),
    getRegistrations({ teamId: id }),
    getMatches(),
  ])
  // Photo albums of this team's matches
  const teamMatchIds = (matches ?? [])
    .filter((m) => m.homeTeamId === id || m.awayTeamId === id)
    .map((m) => m.id)
  const [{ data: albums }, { data: sanctions }] = await Promise.all([
    getAlbums({ matchIds: teamMatchIds }),
    getSanctions(),
  ])
  const suspended = activeSuspensions(sanctions ?? [], matches ?? [])
  const teamAlbums = (albums ?? []).filter((a) => a.photoCount > 0).slice(0, 8)

  // A club can play in several series (e.g. F8 and F11): show every tournament
  // of its latest season, and count goals in those.
  const registeredIds = new Set((registrations ?? []).map((r) => r.tournamentId))
  const teamTournaments = (tournaments ?? [])
    .filter((t) => registeredIds.has(t.id))
    .sort((a, b) => b.season.localeCompare(a.season))
  const latestSeason = teamTournaments[0]?.season
  const currentTournaments = teamTournaments.filter((t) => t.season === latestSeason)

  const { data: scorers } = await getTopScorers(100, {
    teamIds: [id],
    tournamentIds: currentTournaments.map((t) => t.id),
  })
  const goalsByPlayer = new Map((scorers ?? []).map((s) => [s.playerId, s.goals]))

  const teamPlayers = (players ?? [])
    .filter((p) => p.active)
    .sort((a, b) => a.number - b.number)

  // Back to where the visitor came from, or to the team's first division
  const first = currentTournaments[0]
  const backScope = query.serie
    ? resolveScope(seriesOptions, query.serie, query.div)
    : resolveScope(
        seriesOptions,
        seriesOptions.find((s) => s.id === first?.seriesId)?.slug,
        seriesOptions.flatMap((s) => s.divisions).find((d) => d.id === first?.divisionId)?.slug
      )
  const backHref = `/equipos${scopeQuery(backScope)}`

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <div className="bg-background border border-border rounded-lg p-6 md:p-8">
        <Button variant="ghost" size="sm" className="mb-8" render={<Link href={backHref} />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a equipos
        </Button>

        {/* Team header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-14">
          <PhotoAvatar src={team.shield} name={team.name} className="size-24" fallbackClassName="text-2xl" />
          <div className="text-center md:text-left">
            <div className="mb-3 flex flex-wrap justify-center md:justify-start gap-1.5">
              {currentTournaments.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs font-medium">
                  {scopeLabel(seriesOptions, t.seriesId, t.divisionId)}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            {team.coach && (
              <p className="text-sm text-muted-foreground mt-2">
                DT: <span className="text-foreground font-medium">{team.coach}</span>
              </p>
            )}
            {team.assistantCoach && (
              <p className="text-xs text-muted-foreground">Asistente: {team.assistantCoach}</p>
            )}
          </div>
        </div>

        {/* Squad */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="text-xl font-bold">Plantel</h2>
            <span className="text-sm text-muted-foreground">
              {teamPlayers.length} {teamPlayers.length === 1 ? "jugador" : "jugadores"}
            </span>
          </div>

          {teamPlayers.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Sin jugadores registrados
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {teamPlayers.map((player) => {
                const goals = goalsByPlayer.get(player.id) ?? 0
                const suspendedUntil = suspended.get(player.id)?.untilMatchday
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <PhotoAvatar src={player.photo} name={player.name} className="size-14" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {player.number > 0 && (
                          <span className="text-muted-foreground font-mono mr-1.5">#{player.number}</span>
                        )}
                        {player.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {positionLabels[player.position] ?? player.position}
                      </p>
                      {suspendedUntil !== undefined && (
                        <p className="text-[11px] font-semibold text-destructive">
                          Suspendido · vuelve en la fecha {suspendedUntil + 1}
                        </p>
                      )}
                    </div>
                    {goals > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold tabular-nums">{goals}</span>
                        <span className="block text-[10px] text-muted-foreground uppercase">
                          {goals === 1 ? "gol" : "goles"}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {teamAlbums.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold mb-6">Fotos</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {teamAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
