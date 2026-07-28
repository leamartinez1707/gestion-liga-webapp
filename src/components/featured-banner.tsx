import Link from "next/link"
import type { Match, Team, NewsArticle } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface FeaturedBannerProps {
  article: NewsArticle
  match?: Match
  homeTeam?: Team
  awayTeam?: Team
  size?: "large" | "small"
  getTeamName: (id: string) => string
  formatDate: (date: string) => string
}

export function FeaturedBanner({
  article,
  match,
  homeTeam,
  awayTeam,
  size = "large",
  getTeamName,
  formatDate,
}: FeaturedBannerProps) {
  const isLarge = size === "large"

  return (
    <Link href={`/actualidad/${article.id}`}>
      <article
        className={`group relative overflow-hidden rounded-lg border border-border bg-background transition-all hover:shadow-md ${
          isLarge ? "aspect-[21/9] md:aspect-[21/9]" : "aspect-[16/9]"
        }`}
      >
        {/* Image area */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary-light flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Imagen</span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6">
          <Badge className="mb-2 text-[10px] font-normal bg-white/20 text-white border-0 backdrop-blur">
            {article.category}
          </Badge>
          <h3
            className={`font-bold text-white leading-tight group-hover:underline ${
              isLarge ? "text-lg md:text-2xl" : "text-sm"
            }`}
          >
            {article.title}
          </h3>

          {/* Match result */}
          {match && (
            <div className="mt-2 md:mt-3 flex items-center gap-2 md:gap-3 text-white flex-wrap">
              <span className="text-xs md:text-sm font-medium leading-snug">
                {getTeamName(match.homeTeamId)}
              </span>
              <span className="text-base md:text-xl font-bold tabular-nums shrink-0">
                {match.homeScore ?? "-"}
              </span>
              <span className="text-xs text-white/60 shrink-0">vs</span>
              <span className="text-base md:text-xl font-bold tabular-nums shrink-0">
                {match.awayScore ?? "-"}
              </span>
              <span className="text-xs md:text-sm font-medium leading-snug">
                {getTeamName(match.awayTeamId)}
              </span>
            </div>
          )}

          <p className="text-[10px] md:text-xs text-white/60 mt-1">{formatDate(article.date)}</p>
        </div>
      </article>
    </Link>
  )
}
