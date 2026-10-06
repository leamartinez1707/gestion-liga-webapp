import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { Player } from "@/lib/types"
import { requireMatchEditor } from "@/lib/auth"
import { getMatch, getNextMatchdays } from "@/lib/db/matches"
import { getTeam } from "@/lib/db/teams"
import { getPlayersByTeam } from "@/lib/db/players"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getMatchEvents } from "@/lib/db/match-events"
import { getSanctions } from "@/lib/db/sanctions"
import { activeSuspensions } from "@/lib/suspensions"
import { LiveSheet } from "./live-sheet"

export default async function PlanillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const auth = await requireMatchEditor(id)
  if (auth.error) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-center">
        <p className="text-sm text-destructive">{auth.error}</p>
        <Link href="/arbitro" className="mt-3 inline-block text-sm text-primary underline">Volver a mis partidos</Link>
      </div>
    )
  }

  const { data: match } = await getMatch(id)
  if (!match) notFound()

  const [{ data: home }, { data: away }, { data: homePlayers }, { data: awayPlayers }, { data: registrations }, events, nextMatchdays, { data: sanctions }] =
    await Promise.all([
      getTeam(match.homeTeamId),
      getTeam(match.awayTeamId),
      getPlayersByTeam(match.homeTeamId),
      getPlayersByTeam(match.awayTeamId),
      getRegistrations({ tournamentId: match.tournamentId }),
      getMatchEvents(id),
      getNextMatchdays([match.tournamentId]),
      getSanctions({ tournamentIds: [match.tournamentId] }),
    ])
  if (!home || !away) notFound()

  // Players come from each team's lista de buena fe; if it's empty, its active players
  const regs = (registrations ?? []).filter((r) => r.teamId === home.id || r.teamId === away.id)
  const { data: rosters } = await getRosters(regs.map((r) => r.id))
  const rosterOf = (teamId: string, players: Player[]): Player[] => {
    const reg = regs.find((r) => r.teamId === teamId)
    const ids = new Set(reg ? rosters.get(reg.id) ?? [] : [])
    const list = ids.size > 0 ? players.filter((p) => ids.has(p.id)) : players.filter((p) => p.active)
    return list.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name))
  }

  const suspended = activeSuspensions(sanctions ?? [], nextMatchdays)

  return (
    <div className="flex flex-col gap-4">
      <Link href="/arbitro" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Mis partidos
      </Link>
      <LiveSheet
        match={match}
        home={{ id: home.id, name: home.name, shortName: home.shortName, shield: home.shield, players: rosterOf(home.id, homePlayers ?? []) }}
        away={{ id: away.id, name: away.name, shortName: away.shortName, shield: away.shield, players: rosterOf(away.id, awayPlayers ?? []) }}
        events={events}
        suspendedPlayerIds={[...suspended.keys()]}
      />
    </div>
  )
}
