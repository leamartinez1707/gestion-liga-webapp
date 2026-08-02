"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { MatchWithTeams } from "@/lib/db/matches"

interface Props {
  matches: MatchWithTeams[]
  getTeamShortName: (id: string) => string
}

export function FixtureGrid({ matches, getTeamShortName }: Props) {
  const grid = useMemo(() => {
    // Group matches by matchday
    const byMatchday = new Map<number, MatchWithTeams[]>()
    const matchdays = new Set<number>()

    for (const m of matches) {
      matchdays.add(m.matchday)
      const list = byMatchday.get(m.matchday) || []
      list.push(m)
      byMatchday.set(m.matchday, list)
    }

    const sorted = [...matchdays].sort((a, b) => a - b)

    // Build rows: each unique (home, away) pair appears once per matchday
    const pairs = new Map<string, MatchWithTeams[]>()
    for (const m of matches) {
      const key = [m.homeTeamId, m.awayTeamId].sort().join("-")
      const list = pairs.get(key) || []
      list.push(m)
      pairs.set(key, list)
    }

    return { matchdays: sorted, matchesByMatchday: byMatchday }
  }, [matches])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-background px-3 py-2 text-left font-semibold text-muted-foreground border-b min-w-[160px]">
              Equipos
            </th>
            {grid.matchdays.map((md) => (
              <th
                key={md}
                className="px-3 py-2 text-center font-semibold text-muted-foreground border-b min-w-[140px]"
              >
                Fecha {md}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Generate unique match pairs */}
          {(() => {
            const uniquePairs = new Map<string, { home: string; away: string }>()
            for (const m of matches) {
              const key = [m.homeTeamId, m.awayTeamId].sort().join("-")
              if (!uniquePairs.has(key)) {
                uniquePairs.set(key, {
                  home: m.homeTeamId,
                  away: m.awayTeamId,
                })
              }
            }

            return [...uniquePairs.values()].map((pair, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-muted-bg/50" : ""}>
                <td className="sticky left-0 bg-inherit px-3 py-2.5 border-b font-medium whitespace-nowrap">
                  {getTeamShortName(pair.home)} vs {getTeamShortName(pair.away)}
                </td>
                {grid.matchdays.map((md) => {
                  const match = grid.matchesByMatchday
                    .get(md)
                    ?.find(
                      (m) =>
                        (m.homeTeamId === pair.home &&
                          m.awayTeamId === pair.away) ||
                        (m.homeTeamId === pair.away &&
                          m.awayTeamId === pair.home)
                    )

                  if (!match) {
                    return (
                      <td key={md} className="px-3 py-2.5 text-center border-b text-muted-foreground/40">
                        —
                      </td>
                    )
                  }

                  return (
                    <td key={md} className="px-3 py-2.5 text-center border-b">
                      <Link
                        href={`/admin/partidos`}
                        className="block hover:bg-primary/5 rounded transition-colors -m-1 p-1"
                      >
                        {match.status === "finished" ? (
                          <span className="font-bold tabular-nums">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {match.date
                              ? new Date(match.date + "T12:00").toLocaleDateString(
                                  "es-AR",
                                  { day: "numeric", month: "short" }
                                )
                              : "—"}
                          </span>
                        )}
                        {match.status === "finished" && (
                          <span className="block text-[10px] text-success font-medium">
                            FIN
                          </span>
                        )}
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))
          })()}
        </tbody>
      </table>
    </div>
  )
}
