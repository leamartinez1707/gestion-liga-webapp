import { getDelegateTeam } from "@/lib/db/delegates"
import { getPlayersByTeam } from "@/lib/db/players"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeriesOptions } from "@/lib/db/series"
import { scopeLabel } from "@/lib/scope"
import { getNextMatchdays } from "@/lib/db/matches"
import { getSanctions } from "@/lib/db/sanctions"
import { activeSuspensions, sanctionTournamentIds } from "@/lib/suspensions"
import { delegateSetRosterAction } from "@/lib/actions/delegate"
import { RosterDialog } from "@/components/roster-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TeamEditForm } from "./edit-team-form"
import { AddPlayerForm } from "./add-player-form"
import { PlayerRow } from "./player-row"

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export default async function DelegadoDashboard() {
  const { data: team, error: teamError } = await getDelegateTeam()

  if (teamError || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Panel del Equipo</h1>
        <p className="text-muted-foreground max-w-md">
          {teamError ?? "No tenés un equipo asignado. Contactá al administrador de la liga para que te asigne."}
        </p>
      </div>
    )
  }

  const [{ data: players }, { data: registrations }, { data: tournaments }, series, { data: sanctions }] = await Promise.all([
    getPlayersByTeam(team.id),
    getRegistrations({ teamId: team.id }),
    getTournaments(),
    getSeriesOptions(),
    getSanctions({ teamId: team.id }),
  ])
  const playersList = players ?? []
  const [{ data: rosters }, nextMatchdays] = await Promise.all([
    getRosters((registrations ?? []).map((r) => r.id)),
    getNextMatchdays(sanctionTournamentIds(sanctions ?? [])),
  ])
  const suspended = activeSuspensions(sanctions ?? [], nextMatchdays)
  const tournamentMap = new Map((tournaments ?? []).map((t) => [t.id, t]))
  const entries = (registrations ?? [])
    .flatMap((registration) => {
      const tournament = tournamentMap.get(registration.tournamentId)
      return tournament ? [{ registration, tournament }] : []
    })
    .sort((a, b) => b.tournament.season.localeCompare(a.tournament.season))

  return (
    <div className="flex flex-col gap-8">
      {/* Team header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary-light text-primary font-bold text-xl">
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{team.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {team.category} · DT: {team.coach || "Sin asignar"}
                </p>
              </div>
            </div>
            <TeamEditForm team={team} />
          </div>
        </CardHeader>
        <CardContent className="border-t pt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {team.assistantCoach && <span>Ayudante: {team.assistantCoach}</span>}
            <Badge variant="outline" className="text-xs">
              {playersList.length} jugadores
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tournaments + lista de buena fe */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Torneos</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Tu equipo todavía no está inscripto en ningún torneo. La inscripción la carga la liga.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {entries.map(({ registration, tournament }) => {
                const roster = rosters.get(registration.id) ?? []
                const label = `${scopeLabel(series, tournament.seriesId, tournament.divisionId)} (${tournament.season})`
                return (
                  <div key={registration.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tournament.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {label} · {roster.length} en la lista de buena fe
                      </p>
                    </div>
                    <RosterDialog
                      title={`${team.name} · ${label}`}
                      players={playersList}
                      selectedIds={roster}
                      action={delegateSetRosterAction.bind(null, registration.id)}
                    >
                      <Button size="sm" variant="outline">Lista de buena fe</Button>
                    </RosterDialog>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plantel</CardTitle>
            <AddPlayerForm />
          </div>
        </CardHeader>
        <CardContent>
          {playersList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No hay jugadores cargados. Agregá el primero.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {playersList.map((p) => (
                <PlayerRow key={p.id} player={p} suspendedUntil={suspended.get(p.id)?.untilMatchday} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
