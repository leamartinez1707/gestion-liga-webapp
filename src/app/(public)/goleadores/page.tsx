import Link from "next/link"
import { Trophy, Medal } from "lucide-react"

import { getTopScorers } from "@/lib/db/goals"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations } from "@/lib/db/registrations"
import { resolveScope, scopeQuery, teamsInTournament, tournamentLabel, tournamentsInScope } from "@/lib/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoAvatar } from "@/components/photo-avatar"
import { PageHeader } from "@/components/page-header"

function getMedalIcon(position: number) {
  if (position === 0) return <Trophy className="h-4 w-4 text-amber-500" />
  if (position === 1) return <Medal className="h-4 w-4 text-gray-400" />
  if (position === 2) return <Medal className="h-4 w-4 text-amber-700" />
  return <span className="text-xs text-muted-foreground w-4 text-center">{position + 1}</span>
}

interface Props { searchParams: Promise<{ serie?: string; div?: string }> }

export default async function GoleadoresPage({ searchParams }: Props) {
  const params = await searchParams
  const [seriesOptions, { data: teams }, { data: tournaments }, { data: registrations }] = await Promise.all([
    getSeriesOptions(),
    getTeams(),
    getTournaments(),
    getRegistrations(),
  ])

  const scope = resolveScope(seriesOptions, params.serie, params.div)
  const currentTournament = tournamentsInScope(tournaments ?? [], scope)[0]
  const teamIds = teamsInTournament(teams ?? [], registrations ?? [], currentTournament?.id).map((t) => t.id)

  const { data: scorers, error } = await getTopScorers(30, {
    teamIds,
    tournamentIds: currentTournament ? [currentTournament.id] : [],
  })

  const scopeName = [scope.series?.name, scope.division?.name].filter(Boolean).join(" · ")

  return (
    <>
      <PageHeader
        eyebrow={scopeName}
        title="Goleadores"
        subtitle={currentTournament ? tournamentLabel(currentTournament) : "Tabla de goleadores de la división."}
      />
      <div className="page-container py-8 md:py-10">

      {error && (
        <div className="text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {scorers && scorers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Todavía no hay goles cargados en esta división.
        </div>
      )}

      {scorers && scorers.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl font-bold uppercase tracking-wide">Tabla de goleadores</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="divide-y divide-border">
              {scorers.map((s, i) => (
                <li key={s.playerId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-6 flex justify-center shrink-0">{getMedalIcon(i)}</div>
                  <PhotoAvatar src={s.playerPhoto} name={s.playerName} className="size-11" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.playerName}</p>
                    <Link
                      href={`/equipos/${s.teamId}${scopeQuery(scope)}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                    >
                      <PhotoAvatar src={s.teamShield} name={s.teamName} className="size-4" fallbackClassName="text-[7px]" />
                      <span className="truncate">{s.teamName}</span>
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold tabular-nums">{s.goals}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">
                      {s.goals === 1 ? "gol" : "goles"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  )
}
