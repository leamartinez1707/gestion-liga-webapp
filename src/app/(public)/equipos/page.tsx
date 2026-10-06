import Link from "next/link"
import { getTeams } from "@/lib/db/teams"
import { getSeriesOptions } from "@/lib/db/series"
import { getTournaments } from "@/lib/db/tournaments"
import { getRegistrations } from "@/lib/db/registrations"
import { resolveScope, scopeQuery, teamsInTournament, tournamentsInScope } from "@/lib/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoAvatar } from "@/components/photo-avatar"

interface Props {
  searchParams: Promise<{ serie?: string; div?: string }>
}

export default async function EquiposPage({ searchParams }: Props) {
  const params = await searchParams

  const [{ data: teams, error }, seriesOptions, { data: tournaments }, { data: registrations }] =
    await Promise.all([getTeams(), getSeriesOptions(), getTournaments(), getRegistrations()])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-20 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  const scope = resolveScope(seriesOptions, params.serie, params.div)
  // Teams entered in the division's current tournament
  const currentTournament = tournamentsInScope(tournaments ?? [], scope)[0]
  const teamsList = teamsInTournament(teams ?? [], registrations ?? [], currentTournament?.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const scopeName = [scope.series?.name, scope.division?.name].filter(Boolean).join(" · ")

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Equipos{scopeName && <span className="text-primary"> · {scopeName}</span>}
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        {currentTournament
          ? `${teamsList.length} ${teamsList.length === 1 ? "equipo inscripto" : "equipos inscriptos"} en ${currentTournament.name}.`
          : "Esta división todavía no tiene torneo."}
      </p>

      {teamsList.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No hay equipos en esta división todavía.</p>
      ) : (
        <div className="mt-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {teamsList.map((team) => (
            <Link key={team.id} href={`/equipos/${team.id}${scopeQuery(scope)}`}>
              <Card className="h-full border-border transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="items-center text-center pb-3">
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
  )
}
