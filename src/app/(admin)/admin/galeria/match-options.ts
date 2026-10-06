import { getMatches } from "@/lib/db/matches"
import type { MatchOption } from "./album-dialog"

/** Played or scheduled matches, newest first, as options for an album. */
export async function getMatchOptions(): Promise<MatchOption[]> {
  const { data: matches } = await getMatches()
  return (matches ?? [])
    .filter((m) => m.status !== "cancelled")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 200)
    .map((m) => ({
      value: m.id,
      label: `Fecha ${m.matchday} · ${m.homeTeamName} vs ${m.awayTeamName}${m.date ? ` (${m.date})` : ""}`,
    }))
}
