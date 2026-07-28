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
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Equipos</h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Conocé todos los clubes que compiten en la Liga Metropolitana de Futsal.
      </p>

      <div className="mt-12 space-y-14">
        {categories.map((category) => {
          const categoryTeams = teams.filter((t) => t.category === category)
          if (categoryTeams.length === 0) return null

          return (
            <section key={category}>
              <div className="flex items-baseline gap-3 mb-6">
                <h2 className="text-xl font-bold">{category}</h2>
                <span className="text-sm text-muted-foreground">
                  {categoryTeams.length} {categoryTeams.length === 1 ? "equipo" : "equipos"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categoryTeams.map((team) => (
                  <Link key={team.id} href={`/equipos/${team.id}`}>
                    <Card className="h-full border-border transition-all hover:shadow-md hover:border-primary/30">
                      <CardHeader className="items-center text-center pb-3">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary-light text-primary font-semibold text-lg">
                            {getInitials(team.name)}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-sm mt-2 leading-snug">{team.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center text-xs text-muted-foreground pb-5">
                        DT: {team.coach}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
