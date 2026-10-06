import Link from "next/link"
import { getTeamsByIds } from "@/lib/db/teams"
import { getSeriesOptions } from "@/lib/db/series"
import { getTournaments } from "@/lib/db/tournaments"
import { getRegistrations } from "@/lib/db/registrations"
import { resolveScope, scopeQuery, teamsInTournament, tournamentsInScope } from "@/lib/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoAvatar } from "@/components/photo-avatar"
import { PageHeader } from "@/components/page-header"

interface Props {
  searchParams: Promise<{ serie?: string; div?: string }>
}

export default async function EquiposPage({ searchParams }: Props) {
  const params = await searchParams

  const [seriesOptions, { data: tournaments }] = await Promise.all([getSeriesOptions(), getTournaments()])
  const scope = resolveScope(seriesOptions, params.serie, params.div)
  // Teams entered in the division's current tournament: only those are read
  const currentTournament = tournamentsInScope(tournaments ?? [], scope)[0]
  const { data: registrations } = await getRegistrations({ tournamentIds: currentTournament ? [currentTournament.id] : [] })
  const { data: teams, error } = await getTeamsByIds((registrations ?? []).map((r) => r.teamId))

  if (error) {
    return (
      <div className="page-container py-10 md:py-14 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  const teamsList = teamsInTournament(teams ?? [], registrations ?? [], currentTournament?.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const scopeName = [scope.series?.name, scope.division?.name].filter(Boolean).join(" · ")

  return (
    <>
      <PageHeader
        eyebrow={scopeName}
        title="Equipos"
        subtitle={
          currentTournament
            ? `${teamsList.length} ${teamsList.length === 1 ? "equipo inscripto" : "equipos inscriptos"} en ${currentTournament.name}`
            : "Esta división todavía no tiene torneo."
        }
      />
      <div className="page-container py-8 md:py-10">

      {teamsList.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No hay equipos en esta división todavía.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {teamsList.map((team) => (
            <Link key={team.id} href={`/equipos/${team.id}${scopeQuery(scope)}`}>
              <Card className="h-full border-border transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="items-center pt-6 text-center pb-3">
                  <PhotoAvatar src={team.shield} name={team.name} className="size-16 mx-auto" fallbackClassName="text-lg" />
                  <CardTitle className="text-sm mt-2 leading-snug">{team.name}</CardTitle>
                </CardHeader>
                {team.coach && (
                  <CardContent className="text-center text-xs text-muted-foreground pb-5">
                    DT: {team.coach}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
