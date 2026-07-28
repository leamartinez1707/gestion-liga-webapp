import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"

import { teams } from "@/lib/data/teams"
import { players } from "@/lib/data/players"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

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
  const team = teams.find((t) => t.id === id)

  if (!team) {
    notFound()
  }

  const teamPlayers = players.filter((p) => p.teamId === id && p.active)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-6" render={<Link href="/equipos" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a equipos
      </Button>

      {/* Team header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {getInitials(team.name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <Badge variant="secondary" className="mb-2">
            {team.category}
          </Badge>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground mt-2">
            Director Técnico: <span className="font-medium text-foreground">{team.coach}</span>
          </p>
          {team.assistantCoach && (
            <p className="text-muted-foreground text-sm">
              Asistente: {team.assistantCoach}
            </p>
          )}
        </div>
      </div>

      {/* Squad */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Plantel</h2>
          <span className="text-sm text-muted-foreground">
            {teamPlayers.length} {teamPlayers.length === 1 ? "jugador" : "jugadores"}
          </span>
        </div>

        {teamPlayers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Sin jugadores registrados
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-16">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Jugador
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">
                    Posición
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers
                  .sort((a, b) => a.number - b.number)
                  .map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {player.number}
                      </td>
                      <td className="py-3 px-4 font-medium">{player.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                        {positionLabels[player.position] ?? player.position}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
