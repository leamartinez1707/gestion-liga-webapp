import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getArticles } from "@/lib/db/news"
import { getSeriesOptions } from "@/lib/db/series"
import { resolveScope } from "@/lib/scope"
import { CoverImage } from "@/components/cover-image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

interface Props { searchParams: Promise<{ serie?: string; div?: string }> }

export default async function ActualidadPage({ searchParams }: Props) {
  const params = await searchParams
  const [{ data: articles, error }, seriesOptions] = await Promise.all([getArticles(), getSeriesOptions()])
  const { series } = resolveScope(seriesOptions, params.serie, params.div)

  if (error) {
    return (
      <div className="page-container py-10 md:py-14 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  // News of the selected series plus general league news
  const sortedArticles = (articles ?? [])
    .filter((a) => !series || !a.seriesId || a.seriesId === series.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader eyebrow={series?.name} title="Actualidad" subtitle="Noticias y novedades de la liga" />
      <div className="page-container py-8 md:py-10">

      {sortedArticles.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No hay noticias publicadas.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {sortedArticles.map((article) => (
            <Card key={article.id} className="flex flex-col border-border transition-all hover:shadow-md overflow-hidden">
              <div className="relative aspect-[16/9]">
                <CoverImage src={article.imageUrl} alt={article.title} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {article.category ?? "General"}
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
      )}
      </div>
    </>
  )
}
