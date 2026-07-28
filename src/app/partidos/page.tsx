import { matches } from "@/lib/data/matches"
import { teams } from "@/lib/data/teams"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function getTeamShortName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.shortName ?? teamId
}

function getTeamCategory(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.category ?? ""
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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Partidos</h1>
      <p className="text-muted-foreground mb-10">
        Fixture, resultados y calendario de la Liga Metropolitana de Futsal.
      </p>

      {/* Scheduled matches */}
      {scheduledMatches.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Próximos Partidos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      Fecha {match.matchday}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Programado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-right flex-1">
                      <p className="font-semibold">{getTeamShortName(match.homeTeamId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">vs</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold">{getTeamShortName(match.awayTeamId)}</p>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground mt-3">
                    <p>{formatDate(match.date)} — {match.time} hs</p>
                  </div>
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
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      Fecha {match.matchday}
                    </Badge>
                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      Finalizado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-right flex-1">
                      <p className="font-semibold">{getTeamShortName(match.homeTeamId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {match.homeScore}
                      </span>
                      <span className="text-sm text-muted-foreground">-</span>
                      <span className="text-2xl font-bold">
                        {match.awayScore}
                      </span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold">{getTeamShortName(match.awayTeamId)}</p>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground mt-3">
                    <p>{formatDate(match.date)} — {match.time} hs</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
