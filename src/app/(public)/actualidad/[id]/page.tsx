import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getArticle, getArticles } from "@/lib/db/news"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CoverImage } from "@/components/cover-image"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const text = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default async function ArticuloPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: article, error } = await getArticle(id)

  if (error) {
    return (
      <div className="page-container py-10 md:py-14 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  if (!article) {
    notFound()
  }

  // Related reading: latest news of the same series (or general ones)
  const { data: others } = await getArticles()
  const related = (others ?? [])
    .filter((a) => a.id !== article.id && (!article.seriesId || !a.seriesId || a.seriesId === article.seriesId))
    .slice(0, 3)

  return (
    <div className="page-container py-8 md:py-12">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6" render={<Link href="/actualidad" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a actualidad
      </Button>

      <article>
        <header className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Badge variant="secondary" className="text-xs font-medium">{article.category ?? "General"}</Badge>
            <time className="text-sm text-muted-foreground">{formatDate(article.date)}</time>
          </div>
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">{article.excerpt}</p>
          )}
        </header>

        {article.imageUrl && (
          <div className="relative mx-auto mt-8 aspect-[16/9] max-w-6xl overflow-hidden rounded-2xl bg-muted md:mt-10">
            <CoverImage src={article.imageUrl} alt={article.title} sizes="(min-width: 1280px) 1152px, 100vw" priority />
          </div>
        )}

        <div className="mx-auto mt-8 max-w-3xl space-y-6 text-lg leading-relaxed text-foreground/90 md:mt-12">
          {(article.content ?? "").split("\n\n").map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">{paragraph}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tight">Más noticias</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <Link key={a.id} href={`/actualidad/${a.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
                <div className="relative aspect-[16/9] bg-muted">
                  <CoverImage src={a.imageUrl} alt={a.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                  <h3 className="font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
