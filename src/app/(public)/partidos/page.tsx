import { getMatches } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getSeries, getDivisions } from "@/lib/db/series"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function toDivSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

interface Props {
  searchParams: Promise<{ serie?: string; div?: string }>
}

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const serieSlug = params.serie ?? ""
  const divSlug = params.div ?? ""

  const [
    { data: matches, error: matchesError },
    { data: teams },
    { data: seriesList },
    { data: divisionsList },
  ] = await Promise.all([getMatches(), getTeams(), getSeries(), getDivisions()])

  if (matchesError) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-20 text-center">
        <p className="text-destructive text-sm font-medium">{matchesError}</p>
      </div>
    )
  }

  const teamsList = teams ?? []
  const teamMap = new Map(teamsList.map((t) => [t.id, t]))

  function getTeamShortName(teamId: string): string {
    return teamMap.get(teamId)?.shortName ?? teamId
  }

  // Filter by series/division if params present
  let filteredTeamIds: Set<string> | null = null

  if (serieSlug) {
    const series = (seriesList ?? []).find((s) => s.slug === serieSlug)
    if (series) {
      let seriesTeams = teamsList.filter((t) => t.seriesId === series.id)

      if (divSlug) {
        const division = (divisionsList ?? []).find(
          (d) => d.seriesId === series.id && toDivSlug(d.name) === divSlug
        )
        if (division) {
          seriesTeams = seriesTeams.filter((t) => t.divisionId === division.id)
        }
      }

      filteredTeamIds = new Set(seriesTeams.map((t) => t.id))
    }
  }

  const matchesList = (matches ?? []).filter((m) =>
    filteredTeamIds
      ? filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId)
      : true
  )

  const currentSeriesName =
    (seriesList ?? []).find((s) => s.slug === serieSlug)?.name ?? ""

  const finishedMatches = matchesList
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(b.time))

  const scheduledMatches = matchesList
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Partidos{currentSeriesName ? ` · ${currentSeriesName}` : ""}
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Fixture, resultados y calendario de la Liga Metropolitana de Futsal.
      </p>

      <div className="mt-12 space-y-14">
        {/* Scheduled matches */}
        {scheduledMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6">Próximos Partidos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {scheduledMatches.map((match) => (
                <Card key={match.id} className="border-border transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        Fecha {match.matchday}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal">
                        Programado
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-right flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{getTeamShortName(match.homeTeamId)}</p>
                      </div>
                      <div className="shrink-0 text-xs font-semibold text-muted-foreground px-2">vs</div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{getTeamShortName(match.awayTeamId)}</p>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      {formatDate(match.date)} — {match.time} hs
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Finished matches */}
        {finishedMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6">Resultados</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {finishedMatches.map((match) => (
                <Card key={match.id} className="border-border transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        Fecha {match.matchday}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal text-success border-success/30 bg-success-soft">
                        Finalizado
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-right flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{getTeamShortName(match.homeTeamId)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xl font-bold tabular-nums">{match.homeScore}</span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-xl font-bold tabular-nums">{match.awayScore}</span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{getTeamShortName(match.awayTeamId)}</p>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      {formatDate(match.date)} — {match.time} hs
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {scheduledMatches.length === 0 && finishedMatches.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No hay partidos registrados.</p>
        )}
      </div>
    </div>
  )
}
