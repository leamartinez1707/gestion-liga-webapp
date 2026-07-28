import { matches } from "@/lib/data/matches"
import { teams } from "@/lib/data/teams"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function getTeamShortName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.shortName ?? teamId
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function PartidosPage() {
  const finishedMatches = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  const scheduledMatches = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Partidos</h1>
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
