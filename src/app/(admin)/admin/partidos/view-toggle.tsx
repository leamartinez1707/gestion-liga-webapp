"use client"

import { useState } from "react"
import { List, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FixtureGrid } from "@/components/fixture-grid"
import type { MatchWithTeams } from "@/lib/db/matches"

interface Props {
  matches: MatchWithTeams[]
  getTeamShortName: (id: string) => string
  listView: React.ReactNode
}

export function PartidosViewToggle({ matches, getTeamShortName, listView }: Props) {
  const [view, setView] = useState<"list" | "fixture">("list")

  if (matches.length === 0) return <>{listView}</>

  const matchdays = new Set(matches.map((m) => m.matchday))
  const hasMultipleMatchdays = matchdays.size > 1

  return (
    <div className="space-y-4">
      {hasMultipleMatchdays && (
        <div className="flex items-center gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className="gap-1.5"
          >
            <List className="h-4 w-4" /> Lista
          </Button>
          <Button
            variant={view === "fixture" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("fixture")}
            className="gap-1.5"
          >
            <Grid3X3 className="h-4 w-4" /> Fixture
          </Button>
        </div>
      )}
      {view === "list" ? listView : <FixtureGrid matches={matches} getTeamShortName={getTeamShortName} />}
    </div>
  )
}
