import type { Match, Team } from "@/lib/types"
import { PhotoAvatar } from "@/components/photo-avatar"
import { MatchStatusBadge } from "@/components/match-status-badge"

interface Props {
  match: Match
  home?: Team
  away?: Team
}

/** Result of the match a news article is about: one row per team, shield + name + score. */
export function ArticleMatch({ match, home, away }: Props) {
  const played = match.status === "finished" || match.status === "ongoing"
  const rows = [
    { team: home, fallback: "Local", score: match.homeScore },
    { team: away, fallback: "Visitante", score: match.awayScore },
  ]
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Fecha {match.matchday}{match.venue ? ` · ${match.venue}` : ""}</span>
        <MatchStatusBadge match={match} />
      </div>
      <ul className="space-y-2.5">
        {rows.map(({ team, fallback, score }, i) => (
          <li key={i} className="flex items-center gap-3">
            <PhotoAvatar src={team?.shield} name={team?.name ?? fallback} className="size-9" fallbackClassName="text-xs" />
            <span className="flex-1 truncate font-bold uppercase tracking-tight">{team?.name ?? fallback}</span>
            <span className="w-8 text-right text-2xl font-black tabular-nums">{played ? score ?? 0 : "–"}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
