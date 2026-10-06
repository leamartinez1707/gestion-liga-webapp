import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getArticle, getArticles } from "@/lib/db/news"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CoverImage } from "@/components/cover-image"
import { ArticleMatch } from "@/components/article-match"
import { getMatch } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"

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
  const [{ data: others }, { data: match }, { data: teams }] = await Promise.all([
    getArticles(),
    article.matchId ? getMatch(article.matchId) : Promise.resolve({ data: null }),
    article.matchId ? getTeams() : Promise.resolve({ data: null }),
  ])
  const teamById = (id: string) => (teams ?? []).find((t) => t.id === id)
  const related = (others ?? [])
    .filter((a) => a.id !== article.id && (!article.seriesId || !a.seriesId || a.seriesId === article.seriesId))
    .slice(0, 4)

  const body = (
    <>
      {match && (
        <div className="mb-6">
          <ArticleMatch match={match} home={teamById(match.homeTeamId)} away={teamById(match.awayTeamId)} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-xs font-medium">{article.category ?? "General"}</Badge>
        <time className="text-sm text-muted-foreground">{formatDate(article.date)}</time>
      </div>
      <h1 className="mt-4 text-balance font-display text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl">
        {article.title}
      </h1>
      {article.author && <p className="mt-3 text-sm font-medium text-muted-foreground">Por {article.author}</p>}
      {article.excerpt && <p className="mt-5 text-pretty text-lg font-medium text-foreground/80">{article.excerpt}</p>}
      <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground/90 md:text-justify">
        {(article.content ?? "").split("\n\n").map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">{paragraph}</p>
        ))}
      </div>
    </>
  )

  return (
    <div className="page-container py-6 md:py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" render={<Link href="/actualidad" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a actualidad
      </Button>

      {article.imageUrl ? (
        // lg+: photo on one side, story on the other. Below: photo on top.
        <article className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <CoverImage src={article.imageUrl} alt={article.title} sizes="(min-width: 1024px) 60vw, 100vw" priority />
            </div>
          </div>
          <div className="min-w-0">{body}</div>
        </article>
      ) : (
        <article className="max-w-4xl">{body}</article>
      )}

      {related.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-xl font-bold tracking-tight">Más noticias</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {related.map((a) => (
              <Link key={a.id} href={`/actualidad/${a.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
                <div className="relative aspect-[16/9] bg-muted">
                  <CoverImage src={a.imageUrl} alt={a.title} sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
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
