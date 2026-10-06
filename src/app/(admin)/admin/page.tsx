import { LayoutDashboard, Trophy, Users, Calendar, Newspaper } from "lucide-react"

import { getDashboardCounts } from "@/lib/db/stats"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Dashboard Page — totals counted by the database (no rows are downloaded)
// ---------------------------------------------------------------------------
export default async function AdminDashboard() {
  const counts = await getDashboardCounts()

  const stats = [
    {
      title: "Equipos",
      value: counts.teams ?? "—",
      icon: Users,
      description: "equipos registrados",
    },
    {
      title: "Torneos",
      value: counts.tournaments ?? "—",
      icon: Trophy,
      description: "torneos creados",
    },
    {
      title: "Partidos jugados",
      value: counts.finishedMatches ?? "—",
      icon: Calendar,
      description: "partidos finalizados",
    },
    {
      title: "Noticias",
      value: counts.publishedArticles ?? "—",
      icon: Newspaper,
      description: "artículos publicados",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen general de la liga
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
