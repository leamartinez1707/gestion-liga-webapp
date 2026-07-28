import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { newsArticles } from "@/lib/data/news"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function ActualidadPage() {
  const sortedArticles = [...newsArticles].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Actualidad</h1>
      <p className="text-muted-foreground mb-10">
        Noticias, artículos y novedades de la Liga Metropolitana de Futsal.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedArticles.map((article) => (
          <Card key={article.id} className="flex flex-col hover:shadow-md transition-shadow">
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
                <Link
                  href={`/actualidad/${article.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              </CardTitle>
              <CardDescription className="mt-1">
                {article.excerpt}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="link" size="sm" className="px-0" render={<Link href={`/actualidad/${article.id}`} />}>
                Leer más <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
