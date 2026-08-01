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

function TeamShield({ team, size = "md" }: { team?: Team; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-12 h-12 text-sm" : size === "md" ? "w-10 h-10 text-xs" : "w-8 h-8 text-[10px]"
  return (
    <div
      className={cn(
        "rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shrink-0 mx-auto",
        sizeClass
      )}
    >
      {team?.shortName?.[0] ?? "?"}
    </div>
  )
}

export function FixturePanel({
  finishedMatches,
  scheduledMatches,
  teams,
  getTeamName,
  formatDate,
}: FixturePanelProps) {
  const [tab, setTab] = useState<"last" | "next">("last")

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
            "p-1 rounded text-xs font-medium transition-colors",
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
            Próxima ({nextMatchday})
          </button>
        )}
      </div>

      {/* Matches */}
      {displayMatches.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          {tab === "last" ? "No hay resultados todavía." : "No hay partidos programados."}
        </p>
      ) : (
        <div className="space-y-3">
          {displayMatches.map((match) => {
            const homeTeam = teams.find((t) => t.id === match.homeTeamId)
            const awayTeam = teams.find((t) => t.id === match.awayTeamId)

            return (
              <div
                key={match.id}
                className="bg-background p-3"
              >
                {/* Venue + Date */}
                <div className="text-center text-[10px] text-muted-foreground mb-3">
                  {match.venue ?? "Por definir"} · {formatDate(match.date)} {match.time ? `${match.time}` : ""}
                </div>

                {/* Match centered columns */}
                <div className="flex items-center justify-center gap-4">
                  {/* Home team */}
                  <div className="flex flex-col items-center gap-1.5 w-24">
                    <TeamShield team={homeTeam} size="lg" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {getTeamName(match.homeTeamId)}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5">
                    {match.status === "finished" ? (
                      <>
                        <span className="text-2xl font-bold tabular-nums text-foreground">
                          {match.homeScore}
                        </span>
                        <span className="text-sm text-muted-foreground">-</span>
                        <span className="text-2xl font-bold tabular-nums text-foreground">
                          {match.awayScore}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">vs</span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex flex-col items-center gap-1.5 w-24">
                    <TeamShield team={awayTeam} size="lg" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {getTeamName(match.awayTeamId)}
                    </span>
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
