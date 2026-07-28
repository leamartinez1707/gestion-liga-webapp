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
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Actualidad</h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Noticias, artículos y novedades de la Liga Metropolitana de Futsal.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedArticles.map((article) => (
          <Card key={article.id} className="flex flex-col border-border transition-all hover:shadow-md overflow-hidden">
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
                <Link
                  href={`/actualidad/${article.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {article.excerpt}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="link" size="sm" className="px-0 h-auto text-sm font-medium" render={<Link href={`/actualidad/${article.id}`} />}>
                Leer más <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
