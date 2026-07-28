import Link from "next/link"
import { ArrowRight, Calendar, Newspaper } from "lucide-react"

import { leagueInfo } from "@/lib/data/league"
import { matches } from "@/lib/data/matches"
import { teams } from "@/lib/data/teams"
import { newsArticles } from "@/lib/data/news"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function getTeamName(teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? teamId
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function HomePage() {
  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5)

  const latestNews = newsArticles
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center md:text-left">
          <div className="max-w-2xl mx-auto md:mx-0">
            <Badge className="mb-4 text-xs" variant="secondary">
              {leagueInfo.currentSeason}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
              {leagueInfo.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              {leagueInfo.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button size="lg" render={<Link href={leagueInfo.ctaHref} />}>
                {leagueInfo.ctaText}
                <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/equipos" />}>
                Ver Equipos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming matches */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Próximos Partidos</h2>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/partidos" />}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Fecha {match.matchday}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {match.time} hs
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-right flex-1">
                      {getTeamName(match.homeTeamId)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground px-2">vs</span>
                    <span className="font-medium text-sm flex-1">
                      {getTeamName(match.awayTeamId)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {formatDate(match.date)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Últimas Noticias</h2>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/actualidad" />}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestNews.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="aspect-video rounded-lg bg-muted mb-3 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-muted-foreground text-xs">
                      Imagen
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(article.date)}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    <Link href={`/actualidad/${article.id}`} className="hover:text-primary transition-colors">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="link" size="sm" className="px-0" render={<Link href={`/actualidad/${article.id}`} />}>
                    Leer más <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Secciones</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { href: "/equipos", label: "Equipos", desc: "Conocé los clubes y sus planteles" },
              { href: "/partidos", label: "Partidos", desc: "Fixtures, resultados y calendario" },
              { href: "/actualidad", label: "Actualidad", desc: "Noticias, artículos y novedades" },
              { href: "/institucional", label: "Institucional", desc: "Información de la liga" },
            ].map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{section.label}</CardTitle>
                    <CardDescription>{section.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary font-medium">
                      Ir a {section.label} <ArrowRight className="ml-1 inline h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
