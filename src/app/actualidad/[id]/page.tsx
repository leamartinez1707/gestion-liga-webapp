import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { newsArticles } from "@/lib/data/news"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ArticuloPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = newsArticles.find((a) => a.id === id)

  if (!article) {
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-8" render={<Link href="/actualidad" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a actualidad
      </Button>

      {/* Article header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">{article.category}</Badge>
          <time className="text-sm text-muted-foreground">
            {formatDate(article.date)}
          </time>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
          {article.title}
        </h1>
      </header>

      {/* Image placeholder */}
      <div className="aspect-video rounded-xl bg-muted mb-10 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-muted-foreground text-sm">
          Imagen del artículo
        </div>
      </div>

      {/* Article body */}
      <div className="prose prose-sm md:prose-base max-w-none">
        {article.content.split("\n\n").map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="mt-12 pt-6 border-t border-border">
        <Button variant="outline" size="sm" render={<Link href="/actualidad" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Más artículos
        </Button>
      </div>
    </article>
  )
}
