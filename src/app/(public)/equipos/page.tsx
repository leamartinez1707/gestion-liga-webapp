import Link from "next/link"
import { getTeams } from "@/lib/db/teams"
import { getSeries, getDivisions } from "@/lib/db/series"
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

export default async function EquiposPage({ searchParams }: Props) {
  const params = await searchParams
  const serieSlug = params.serie ?? ""
  const divSlug = params.div ?? ""

  const [{ data: teams, error }, { data: seriesList }, { data: divisionsList }] =
    await Promise.all([getTeams(), getSeries(), getDivisions()])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-20 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  let teamsList = teams ?? []

  // Filter by series if param is present
  if (serieSlug) {
    const series = (seriesList ?? []).find((s) => s.slug === serieSlug)
    if (series) {
      teamsList = teamsList.filter((t) => t.seriesId === series.id)

      // Filter further by division
      if (divSlug) {
        const division = (divisionsList ?? []).find(
          (d) => d.seriesId === series.id && toDivSlug(d.name) === divSlug
        )
        if (division) {
          teamsList = teamsList.filter((t) => t.divisionId === division.id)
        }
      }
    }
  }

  const currentSeriesName =
    (seriesList ?? []).find((s) => s.slug === serieSlug)?.name ?? ""

  const categories = [...new Set(teamsList.map((t) => t.category).filter(Boolean))]

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Equipos{currentSeriesName ? ` · ${currentSeriesName}` : ""}
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Conocé todos los clubes que compiten en la Liga Metropolitana de Futsal.
      </p>

      <div className="mt-12 space-y-14">
        {categories.map((category) => {
          const categoryTeams = teamsList.filter((t) => t.category === category)
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

        {teamsList.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No hay equipos registrados.</p>
        )}
      </div>
    </div>
  )
}
