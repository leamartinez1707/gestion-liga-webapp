import Link from "next/link"
import { teams } from "@/lib/data/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const categories = ["Primera División", "Segunda División"]

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export default function EquiposPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Equipos</h1>
      <p className="text-muted-foreground mb-10">
        Conocé todos los clubes que compiten en la Liga Metropolitana de Futsal.
      </p>

      {categories.map((category) => {
        const categoryTeams = teams.filter((t) => t.category === category)
        if (categoryTeams.length === 0) return null

        return (
          <section key={category} className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {category}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {categoryTeams.length} {categoryTeams.length === 1 ? "equipo" : "equipos"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryTeams.map((team) => (
                <Link key={team.id} href={`/equipos/${team.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                    <CardHeader className="items-center text-center pb-2">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {getInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-base mt-2">{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                      <p>DT: {team.coach}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
