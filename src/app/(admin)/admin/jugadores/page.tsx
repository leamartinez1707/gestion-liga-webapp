import { Plus, Pencil, Trash2 } from "lucide-react"

import { getPlayers } from "@/lib/db/players"
import { getTeams } from "@/lib/db/teams"
import {
  createPlayerAction,
  updatePlayerAction,
  deletePlayerAction,
} from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayerDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { PlayerTeamFilter } from "./filter"

const positionLabels: Record<string, string> = {
  arquero: "Arquero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
}

export default async function JugadoresPage(props: {
  searchParams?: Promise<{ team?: string }>
}) {
  const searchParams = await props.searchParams
  const teamFilter = searchParams?.team

  const { data: allPlayers, error: playersError } = await getPlayers()
  const { data: teams, error: teamsError } = await getTeams()

  if (playersError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-sm font-medium">{playersError}</p>
      </div>
    )
  }

  const playersList = allPlayers ?? []
  const teamsList = teams ?? []

  const filtered = teamFilter
    ? playersList.filter((p) => p.teamId === teamFilter)
    : playersList

  const teamMap = new Map(teamsList.map((t) => [t.id, t.name]))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Jugadores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná los jugadores de la liga
          </p>
        </div>
        <PlayerDialog action={createPlayerAction} teams={teamsList}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo Jugador
          </Button>
        </PlayerDialog>
      </div>

      {/* Filter */}
      <PlayerTeamFilter teams={teamsList} currentTeam={teamFilter} />

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">N°</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Posición</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-20 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay jugadores{teamFilter ? " para este equipo" : " todavía"}.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="text-center text-muted-foreground">
                  {player.number || "—"}
                </TableCell>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {positionLabels[player.position] ?? player.position}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {teamMap.get(player.teamId) ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={player.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {player.active ? "Activo" : "Suspendido"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <PlayerDialog
                      action={updatePlayerAction.bind(null, player.id)}
                      player={player}
                      teams={teamsList}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PlayerDialog>
                    <DeleteConfirmDialog
                      itemName={player.name}
                      onConfirm={deletePlayerAction.bind(null, player.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
