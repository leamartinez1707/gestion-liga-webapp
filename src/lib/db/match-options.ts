import { getMatches } from "@/lib/db/matches"

export interface MatchOption {
  value: string
  /** e.g. "Fecha 3 · Los Pumas vs Titanes (2026-08-15)" */
  label: string
}

/** Played or scheduled matches, newest first, to link an album or a news article. */
export async function getMatchOptions(): Promise<MatchOption[]> {
  const { data: matches } = await getMatches()
  return (matches ?? [])
    .filter((m) => m.status !== "cancelled")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 200)
    .map((m) => ({
      value: m.id,
      label: m.status === "finished"
        ? `Fecha ${m.matchday} · ${m.homeTeamName} ${m.homeScore ?? 0}-${m.awayScore ?? 0} ${m.awayTeamName}`
        : `Fecha ${m.matchday} · ${m.homeTeamName} vs ${m.awayTeamName}${m.date ? ` (${m.date})` : ""}`,
    }))
}
