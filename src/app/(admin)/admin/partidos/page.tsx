import { Suspense } from "react"
import { Plus, Pencil, Trash2, CalendarX } from "lucide-react"
import { getMatchdays, getMatchesPaginated } from "@/lib/db/matches"
import { getSeriesOptions } from "@/lib/db/series"
import { tournamentOptions } from "@/lib/scope"
import { normalize } from "@/lib/text"
import { ListFilters, type FilterSelect } from "@/components/admin/list-filters"
import { getTeamsByIds } from "@/lib/db/teams"
import { getRegistrations } from "@/lib/db/registrations"
import { getGoalsByMatch } from "@/lib/db/goals"
import { getSanctions } from "@/lib/db/sanctions"
import { getReferees } from "@/lib/db/referees"
import { getMatchIdsWithEvents } from "@/lib/db/match-events"
import { getPlayersByTeams } from "@/lib/db/players"
import { getTournaments } from "@/lib/db/tournaments"
import { createMatchAction, updateMatchAction, deleteMatchAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MatchDialog } from "./dialog"
import { SuspendMatchdayDialog } from "./suspend-dialog"
import { MatchStatusBadge } from "@/components/match-status-badge"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { PartidosViewToggle } from "./view-toggle"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string; q?: string; temporada?: string; torneo?: string; equipo?: string; fecha?: string; estado?: string }> }

/** Current year if some tournament is from it, otherwise the newest season. */
function defaultSeason(seasons: string[]): string {
  const year = String(new Date().getFullYear())
  return seasons.includes(year) ? year : seasons[0] ?? ""
}

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)

  // Everything on this page belongs to one season, so the load doesn't grow with the league's history
  const [{ data: allTournaments }, series] = await Promise.all([getTournaments(), getSeriesOptions()])
  const seasons = [...new Set((allTournaments ?? []).map((t) => t.season))].sort((a, b) => b.localeCompare(a))
  const currentSeason = defaultSeason(seasons)
  const season = params.temporada && seasons.includes(params.temporada) ? params.temporada : currentSeason
  const tournaments = (allTournaments ?? []).filter((t) => t.season === season)
  const tournamentIds = tournaments.map((t) => t.id)
  // The list, the filters and the dialogs only see this season's tournaments and the teams entered in them
  const { data: registrations } = await getRegistrations({ tournamentIds })
  const { data: teams } = await getTeamsByIds((registrations ?? []).map((r) => r.teamId))

  // Search by team name (home or away); combined with the team filter
  const term = normalize(params.q ?? "")
  let teamIds: string[] | undefined = params.equipo ? [params.equipo] : undefined
  if (term) {
    const named = (teams ?? []).filter((t) => normalize(`${t.name} ${t.shortName}`).includes(term)).map((t) => t.id)
    teamIds = teamIds ? teamIds.filter((id) => named.includes(id)) : named
  }
  const matchday = parseInt(params.fecha ?? "", 10) || undefined
  const { data: matches, error, total, totalPages } = await getMatchesPaginated(page, LIMIT, {
    tournamentIds,
    tournamentId: params.torneo,
    teamIds,
    matchday,
    status: params.estado,
  })
  const STATUS_OPTIONS = [
    { value: "scheduled", label: "Programados" },
    { value: "ongoing", label: "En juego" },
    { value: "finished", label: "Finalizados" },
    { value: "postponed", label: "Suspendidos" },
    { value: "cancelled", label: "Cancelados" },
  ]
  const filtering = !!(params.q || params.torneo || params.equipo || params.fecha || params.estado)
  // "Fecha" filter: the matchdays of the chosen tournament (only that column is read)
  const matchdays = params.torneo && tournamentIds.includes(params.torneo) ? await getMatchdays(params.torneo) : []
  const filterSelects: FilterSelect[] = [
    {
      param: "temporada",
      allLabel: "Temporada",
      options: seasons.map((s) => ({ value: s, label: `Temporada ${s}` })),
      defaultValue: currentSeason,
      clears: ["torneo", "equipo", "fecha"],
    },
    { param: "torneo", allLabel: "Todos los torneos", options: tournamentOptions(tournaments, series) },
    { param: "equipo", allLabel: "Todos los equipos", options: [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.id, label: t.name })) },
    ...(matchdays.length ? [{ param: "fecha", allLabel: "Todas las fechas", options: matchdays.map((md) => ({ value: String(md), label: `Fecha ${md}` })) }] : []),
    { param: "estado", allLabel: "Todos los estados", options: STATUS_OPTIONS },
  ]

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const matchesList = matches || []
  // Players are only used when editing a match (scorers, red cards): just the teams on this page
  const [goalsByMatch, { data: sanctions }, referees, withSheet, { data: players }] = await Promise.all([
    getGoalsByMatch(matchesList.map((m) => m.id)),
    getSanctions({ matchIds: matchesList.map((m) => m.id) }),
    getReferees(),
    getMatchIdsWithEvents(matchesList.map((m) => m.id)),
    getPlayersByTeams(matchesList.flatMap((m) => [m.homeTeamId, m.awayTeamId])),
  ])
  const playersOf = (m: { homeTeamId: string; awayTeamId: string }) =>
    (players ?? []).filter((p) => p.teamId === m.homeTeamId || p.teamId === m.awayTeamId)
  const redCardsOf = (matchId: string) =>
    (sanctions ?? []).filter((s) => s.matchId === matchId && s.cardType === "red").map((s) => s.playerId)

  // Plain object: functions can't be passed to the client toggle
  const shortNames = Object.fromEntries([...teamMap].map(([id, t]) => [id, t.shortName]))

  const listView = (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Local</TableHead><TableHead>Resultado</TableHead><TableHead>Visitante</TableHead><TableHead>Estado</TableHead><TableHead className="w-24 text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
          {matchesList.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{filtering ? "Ningún partido coincide con la búsqueda." : "No hay partidos."}</TableCell></TableRow>}
          {matchesList.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{m.date || "Sin fecha"} · F{m.matchday}</TableCell>
              <TableCell className="font-medium">{m.homeTeamName}</TableCell>
              <TableCell>{m.status === "finished" ? <span className="font-bold tabular-nums">{m.homeScore} - {m.awayScore}</span> : "—"}</TableCell>
              <TableCell className="font-medium">{m.awayTeamName}</TableCell>
              <TableCell><MatchStatusBadge match={m} /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <MatchDialog action={updateMatchAction.bind(null, m.id)} match={m} existingGoals={goalsByMatch.get(m.id)} redCardPlayerIds={redCardsOf(m.id)} referees={referees} hasSheet={withSheet.has(m.id)} teams={teams ?? []} registrations={registrations ?? []} tournaments={tournaments} players={playersOf(m)}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></MatchDialog>
                  <DeleteConfirmDialog itemName={`${m.homeTeamName} vs ${m.awayTeamName}`} onConfirm={deleteMatchAction.bind(null, m.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Partidos</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los partidos de la liga</p></div>
        <div className="flex items-center gap-2">
          {/* New match: no players needed (scorers and cards are loaded when editing) */}
          <MatchDialog action={createMatchAction} teams={teams ?? []} registrations={registrations ?? []} tournaments={tournaments} players={[]}>
            <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Partido</Button>
          </MatchDialog>
          <SuspendMatchdayDialog tournaments={tournaments}>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <CalendarX className="h-4 w-4" /> Suspender Fecha
            </Button>
          </SuspendMatchdayDialog>
        </div>
      </div>

      <Suspense>
        <ListFilters
          searchPlaceholder="Buscar por equipo"
          selects={filterSelects}
          resultLabel={`${total} ${total === 1 ? "partido" : "partidos"}`}
        />
      </Suspense>

      <PartidosViewToggle matches={matchesList} shortNames={shortNames} listView={listView} />

      <Suspense><Pagination page={page} totalPages={totalPages} /></Suspense>
    </div>
  )
}
