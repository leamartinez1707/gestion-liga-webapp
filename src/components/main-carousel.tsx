"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import type { NewsArticle } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CoverImage } from "@/components/cover-image"

interface MainCarouselProps {
  articles: NewsArticle[]
  formatDate: (date: string) => string
}

export function MainCarousel({
  articles,
  formatDate,
}: MainCarouselProps) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = articles.length

  const prev = useCallback(() => setCurrent((c) => (c <= 0 ? total - 1 : c - 1)), [total])
  const next = useCallback(() => setCurrent((c) => (c >= total - 1 ? 0 : c + 1)), [total])

  // Auto-advance
  useEffect(() => {
    if (total < 2) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, total])

  if (total === 0) return null

  // The list changes with the selected series: keep the index in range
  const index = current % total
  const article = articles[index]

  return (
    <div className="relative group">
      {/* Slides */}
      <Link href={`/actualidad/${article.id}`}>
        <div className="relative overflow-hidden rounded-lg border border-border bg-background aspect-[21/9]">
          <CoverImage src={article.image} alt={article.title} sizes="(min-width: 1024px) 60vw, 100vw" priority={index === 0} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-8">
            <Badge className="mb-2 text-[10px] font-normal bg-white/20 text-white border-0 backdrop-blur-sm">
              {article.category}
            </Badge>
            <h3 className="text-lg md:text-2xl font-bold text-white leading-tight max-w-xl">
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="mt-2 hidden max-w-2xl text-sm text-white/80 line-clamp-2 md:block">{article.excerpt}</p>
            )}

            <p className="text-[10px] md:text-xs text-white/50 mt-1">{formatDate(article.date)}</p>
          </div>
        </div>
      </Link>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === index ? "bg-primary w-4" : "bg-border hover:bg-muted-foreground"
              )}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
