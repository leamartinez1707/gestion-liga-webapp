"use client"

import { useState } from "react"
import type { Match, Team } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FixturePanelProps {
  finishedMatches: Match[]
  scheduledMatches: Match[]
  teams: Team[]
  getTeamName: (id: string) => string
  formatDate: (date: string) => string
}

export function FixturePanel({
  finishedMatches,
  scheduledMatches,
  teams,
  getTeamName,
  formatDate,
}: FixturePanelProps) {
  const [tab, setTab] = useState<"last" | "next">("last")

  // Get the last completed matchday
  const lastMatchday = finishedMatches.length > 0
    ? Math.max(...finishedMatches.map((m) => m.matchday))
    : 0

  const lastStageMatches = finishedMatches
    .filter((m) => m.matchday === lastMatchday)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const nextMatchday = scheduledMatches.length > 0
    ? Math.min(...scheduledMatches.map((m) => m.matchday))
    : 0

  const nextStageMatches = scheduledMatches
    .filter((m) => m.matchday === nextMatchday)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const displayMatches = tab === "last" ? lastStageMatches : nextStageMatches
  const displayMatchday = tab === "last" ? lastMatchday : nextMatchday

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab("last")}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            tab === "last"
              ? "bg-primary text-primary-foreground"
              : "bg-muted-bg text-muted-foreground hover:text-foreground"
          )}
        >
          Última etapa {lastMatchday > 0 && `(${lastMatchday})`}
        </button>
        {nextMatchday > 0 && (
          <button
            onClick={() => setTab("next")}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium transition-colors",
              tab === "next"
                ? "bg-primary text-primary-foreground"
                : "bg-muted-bg text-muted-foreground hover:text-foreground"
            )}
          >
            Próxima etapa ({nextMatchday})
          </button>
        )}
      </div>

      {/* Matches */}
      {displayMatches.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {tab === "last" ? "No hay resultados todavía." : "No hay partidos programados."}
        </p>
      ) : (
        <div className="space-y-2">
          {displayMatches.map((match) => {
            const homeTeam = teams.find((t) => t.id === match.homeTeamId)
            const awayTeam = teams.find((t) => t.id === match.awayTeamId)
            return (
              <div
                key={match.id}
                className="rounded-lg border border-border bg-background p-2.5 text-xs"
              >
                {/* Top row: venue + day */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span>{match.venue ?? "Por definir"}</span>
                  <span>{formatDate(match.date)} {match.time ? `${match.time} hs` : ""}</span>
                </div>
                {/* Match content */}
                <div className="flex items-center gap-2">
                  {/* Home team */}
                  <div className="flex-1 flex items-center gap-1.5 justify-end">
                    <span className="font-medium text-right text-xs leading-snug">{getTeamName(match.homeTeamId)}</span>
                    <div className="w-5 h-5 rounded-full bg-primary-light shrink-0 flex items-center justify-center text-[8px] text-primary font-bold">
                      {homeTeam?.shortName?.[0] ?? "?"}
                    </div>
                  </div>
                  {/* Score */}
                  <div className="shrink-0 flex items-center gap-1">
                    {match.status === "finished" ? (
                      <>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {match.homeScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">-</span>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {match.awayScore}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground px-1">vs</span>
                    )}
                  </div>
                  {/* Away team */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary-light shrink-0 flex items-center justify-center text-[8px] text-primary font-bold">
                      {awayTeam?.shortName?.[0] ?? "?"}
                    </div>
                    <span className="font-medium text-xs leading-snug">{getTeamName(match.awayTeamId)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
