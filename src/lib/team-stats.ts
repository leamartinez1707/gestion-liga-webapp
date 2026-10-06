import type { Match } from "@/lib/types"

export interface TeamRecord {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

export type Outcome = "G" | "E" | "P"

/** Result of a finished match from the team's point of view. */
export function outcomeFor(match: Match, teamId: string): Outcome | null {
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) return null
  const own = match.homeTeamId === teamId ? match.homeScore : match.awayScore
  const other = match.homeTeamId === teamId ? match.awayScore : match.homeScore
  return own > other ? "G" : own < other ? "P" : "E"
}

/** Won / drawn / lost and goals over the team's finished matches. */
export function teamRecord(matches: Match[], teamId: string): TeamRecord {
  const record: TeamRecord = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
  for (const m of matches) {
    const outcome = outcomeFor(m, teamId)
    if (!outcome) continue
    const isHome = m.homeTeamId === teamId
    record.played += 1
    record.goalsFor += (isHome ? m.homeScore : m.awayScore) ?? 0
    record.goalsAgainst += (isHome ? m.awayScore : m.homeScore) ?? 0
    if (outcome === "G") record.won += 1
    else if (outcome === "E") record.drawn += 1
    else record.lost += 1
  }
  return record
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}
