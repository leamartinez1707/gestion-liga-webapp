import { getTopScorers } from "@/lib/db/goals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal } from "lucide-react"

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function getMedalIcon(position: number) {
  if (position === 0) return <Trophy className="h-4 w-4 text-amber-500" />
  if (position === 1) return <Medal className="h-4 w-4 text-gray-400" />
  if (position === 2) return <Medal className="h-4 w-4 text-amber-700" />
  return <span className="text-xs text-muted-foreground w-4 text-center">{position + 1}</span>
}

export default async function GoleadoresPage() {
  const { data: scorers, error } = await getTopScorers(30)

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Goleadores</h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Tabla de goleadores de la Liga Metropolitana de Futsal.
      </p>

      {error && (
        <div className="mt-12 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {scorers && scorers.length === 0 && (
        <div className="mt-12 text-center py-12 text-muted-foreground">
          No hay datos de goles todavía.
        </div>
      )}

      {scorers && scorers.length > 0 && (
        <Card className="mt-12 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tabla de Goleadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {scorers.map((s, i) => (
                <div key={s.playerId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-6 flex justify-center">
                    {getMedalIcon(i)}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {getInitials(s.playerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.playerName}</p>
                    <p className="text-xs text-muted-foreground">{s.teamName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold tabular-nums">{s.goals}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">
                      {s.goals === 1 ? "gol" : "goles"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
