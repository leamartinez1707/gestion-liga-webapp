import type { NewsArticle, Match, Team } from "@/lib/types"
import { FeaturedBanner } from "@/components/featured-banner"

interface ScrollableBannersProps {
  articles: NewsArticle[]
  matches?: Match[]
  teams?: Team[]
  getTeamName: (id: string) => string
  formatDate: (date: string) => string
  size?: "large" | "small"
}

export function ScrollableBanners({
  articles,
  matches: allMatches,
  teams: allTeams,
  getTeamName,
  formatDate,
  size = "small",
}: ScrollableBannersProps) {
  if (articles.length === 0) return null

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
      {articles.map((article) => {
        const relatedMatch = allMatches?.find(
          (m) => m.status === "finished" && (
            getTeamName(m.homeTeamId).toLowerCase().includes(article.title.toLowerCase().slice(0, 10))
          )
        )
        return (
          <div key={article.id} className="snap-start shrink-0 w-[85vw] sm:w-[350px]">
            <FeaturedBanner
              article={article}
              match={relatedMatch}
              homeTeam={relatedMatch && allTeams ? allTeams.find((t) => t.id === relatedMatch.homeTeamId) : undefined}
              awayTeam={relatedMatch && allTeams ? allTeams.find((t) => t.id === relatedMatch.awayTeamId) : undefined}
              size={size}
              getTeamName={getTeamName}
              formatDate={formatDate}
            />
          </div>
        )
      })}
    </div>
  )
}
