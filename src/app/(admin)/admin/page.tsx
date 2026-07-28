import { LayoutDashboard, Trophy, Users, Calendar, Newspaper } from "lucide-react"

import { teams } from "@/lib/data/teams"
import { tournaments } from "@/lib/data/tournaments"
import { matches } from "@/lib/data/matches"
import { newsArticles } from "@/lib/data/news"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Stats for the dashboard (sourced from mock data — real DB queries come in
// PR 2/3 once DAL modules are wired).
// ---------------------------------------------------------------------------
const stats = [
  {
    title: "Equipos",
    value: teams.length,
    icon: Users,
    description: "equipos registrados",
  },
  {
    title: "Torneos activos",
    value: tournaments.length,
    icon: Trophy,
    description: "torneos en curso",
  },
  {
    title: "Próximos partidos",
    value: matches.filter((m) => m.status === "scheduled").length,
    icon: Calendar,
    description: "partidos programados",
  },
  {
    title: "Noticias publicadas",
    value: newsArticles.length,
    icon: Newspaper,
    description: "artículos publicados",
  },
]

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
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
