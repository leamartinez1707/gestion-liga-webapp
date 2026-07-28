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
    <article className="container mx-auto px-4 py-16 md:py-20 max-w-3xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-8" render={<Link href="/actualidad" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a actualidad
      </Button>

      {/* Article header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="text-xs font-medium">{article.category}</Badge>
          <time className="text-sm text-muted-foreground">
            {formatDate(article.date)}
          </time>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          {article.title}
        </h1>
      </header>

      {/* Article body */}
      <div className="text-base leading-relaxed text-foreground/90 space-y-5">
        {article.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="mt-14 pt-6 border-t border-border">
        <Button variant="outline" size="sm" render={<Link href="/actualidad" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Más artículos
        </Button>
      </div>
    </article>
  )
}
