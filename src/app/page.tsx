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
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-primary-foreground/90">
              {leagueInfo.currentSeason}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">
              {leagueInfo.name}
            </h1>
            <p className="mt-3 text-lg text-primary-foreground/80 max-w-lg">
              {leagueInfo.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                render={<Link href={leagueInfo.ctaHref} />}
              >
                {leagueInfo.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-primary-foreground hover:bg-white/10"
                render={<Link href="/equipos" />}
              >
                Ver Equipos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming matches */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Próximos Partidos</h2>
            <Button variant="ghost" size="sm" render={<Link href="/partidos" />}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMatches.map((match) => (
                <Card key={match.id} className="border-border transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        Fecha {match.matchday}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {match.time} hs
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-right flex-1 leading-tight">
                        {getTeamName(match.homeTeamId)}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground px-2">vs</span>
                      <span className="text-sm font-semibold flex-1 leading-tight">
                        {getTeamName(match.awayTeamId)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {formatDate(match.date)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No hay partidos programados aún.</p>
          )}
        </div>
      </section>

      {/* Latest news */}
      <section className="py-16 md:py-20 bg-muted-bg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>
            <Button variant="ghost" size="sm" render={<Link href="/actualidad" />}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {latestNews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {latestNews.map((article) => (
                <Card key={article.id} className="border-border transition-all hover:shadow-md overflow-hidden">
                  <div className="aspect-[16/9] bg-primary-light flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Sin imagen</span>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(article.date)}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-snug">
                      <Link href={`/actualidad/${article.id}`} className="hover:text-primary transition-colors">
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="link" size="sm" className="px-0 h-auto text-sm font-medium" render={<Link href={`/actualidad/${article.id}`} />}>
                      Leer más <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No hay noticias aún.</p>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Secciones</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { href: "/equipos", label: "Equipos", desc: "Conocé los clubes y sus planteles" },
              { href: "/partidos", label: "Partidos", desc: "Fixtures, resultados y calendario" },
              { href: "/actualidad", label: "Actualidad", desc: "Noticias, artículos y novedades" },
              { href: "/institucional", label: "Institucional", desc: "Información de la liga" },
            ].map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="h-full border-border transition-all hover:shadow-md hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{section.label}</CardTitle>
                    <CardDescription className="text-sm">{section.desc}</CardDescription>
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
