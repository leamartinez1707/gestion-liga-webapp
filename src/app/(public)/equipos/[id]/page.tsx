import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getTeam } from "@/lib/db/teams"
import { getPlayersByTeam } from "@/lib/db/players"
import { getTopScorers } from "@/lib/db/goals"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { scopeLabel, scopeQuery, tournamentsInScope } from "@/lib/scope"
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
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: team, error: teamError } = await getTeam(id)
  if (teamError || !team) notFound()

  const [{ data: players }, seriesOptions, { data: tournaments }] = await Promise.all([
    getPlayersByTeam(id),
    getSeriesOptions(),
    getTournaments(),
  ])

  // The team's own series/division is the scope for "back" links and its current tournament
  const series = seriesOptions.find((s) => s.id === team.seriesId) ?? null
  const scope = { series, division: series?.divisions.find((d) => d.id === team.divisionId) ?? null }
  const currentTournament = scope.division ? tournamentsInScope(tournaments ?? [], scope)[0] : undefined

  const { data: scorers } = await getTopScorers(100, {
    teamIds: [id],
    tournamentIds: currentTournament ? [currentTournament.id] : undefined,
  })
  const goalsByPlayer = new Map((scorers ?? []).map((s) => [s.playerId, s.goals]))

  const teamPlayers = (players ?? [])
    .filter((p) => p.active)
    .sort((a, b) => a.number - b.number)

  const backHref = `/equipos${scopeQuery(scope)}`

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
            <Badge variant="secondary" className="mb-3 text-xs font-medium">
              {scopeLabel(seriesOptions, team.seriesId, team.divisionId)}
            </Badge>
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
      </div>
    </div>
  )
}
