"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import type { NewsArticle, Match, Team } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MainCarouselProps {
  articles: NewsArticle[]
  matches?: Match[]
  teams?: Team[]
  getTeamName: (id: string) => string
  formatDate: (date: string) => string
}

export function MainCarousel({
  articles,
  matches: allMatches,
  teams: allTeams,
  getTeamName,
  formatDate,
}: MainCarouselProps) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = articles.length
  if (total === 0) return null

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? total - 1 : c - 1)), [total])
  const next = useCallback(() => setCurrent((c) => (c === total - 1 ? 0 : c + 1)), [total])

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  const article = articles[current]
  const match = allMatches?.[current]

  return (
    <div className="relative group">
      {/* Slides */}
      <Link href={`/actualidad/${article.id}`}>
        <div className="relative overflow-hidden rounded-lg border border-border bg-background aspect-[21/9]">
          {/* Image placeholder */}
          <div className="absolute inset-0 bg-primary-light" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-8">
            <Badge className="mb-2 text-[10px] font-normal bg-white/20 text-white border-0 backdrop-blur-sm">
              {article.category}
            </Badge>
            <h3 className="text-lg md:text-2xl font-bold text-white leading-tight max-w-xl">
              {article.title}
            </h3>

            {match && (
              <div className="mt-2 md:mt-3 flex items-center gap-2 md:gap-3 text-white flex-wrap">
                <span className="text-xs md:text-sm font-medium">{getTeamName(match.homeTeamId)}</span>
                <span className="text-lg md:text-2xl font-bold tabular-nums shrink-0">{match.homeScore ?? "-"}</span>
                <span className="text-xs text-white/60 shrink-0">vs</span>
                <span className="text-lg md:text-2xl font-bold tabular-nums shrink-0">{match.awayScore ?? "-"}</span>
                <span className="text-xs md:text-sm font-medium">{getTeamName(match.awayTeamId)}</span>
              </div>
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
                i === current ? "bg-primary w-4" : "bg-border hover:bg-muted-foreground"
              )}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
