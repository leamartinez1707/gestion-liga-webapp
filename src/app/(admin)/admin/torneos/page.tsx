import { Plus, Pencil, Trash2, Calendar } from "lucide-react"

import { getTournaments } from "@/lib/db/tournaments"
import { getTeamsByTournament } from "@/lib/db/teams"
import {
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  generateFixtureAction,
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
import { TournamentDialog } from "./dialog"
import { FixtureDialog } from "./fixture-dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

const formatLabels: Record<string, string> = {
  league: "Liga",
  elimination: "Eliminatorias",
  groups: "Grupos",
}

export default async function TorneosPage() {
  const tournaments = await getTournaments()

  // Fetch teams grouped by tournament for fixture generation
  const allTeams = await Promise.all(
    tournaments.map(async (t) => {
      const teams = await getTeamsByTournament(t.id)
      return { tournamentId: t.id, teams }
    })
  )
  const teamsByTournament = new Map(allTeams.map((t) => [t.tournamentId, t.teams]))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Torneos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná los torneos de la liga
          </p>
        </div>
        <TournamentDialog action={createTournamentAction}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo Torneo
          </Button>
        </TournamentDialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Temporada</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay torneos todavía. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.category}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.season}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {formatLabels[t.format] ?? t.format}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <FixtureDialog
                      action={generateFixtureAction}
                      tournamentId={t.id}
                      tournamentName={t.name}
                      teams={teamsByTournament.get(t.id) ?? []}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        aria-label="Generar fixture"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Fixture
                      </Button>
                    </FixtureDialog>
                    <TournamentDialog
                      action={updateTournamentAction.bind(null, t.id)}
                      tournament={t}
                    >
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TournamentDialog>
                    <DeleteConfirmDialog
                      itemName={t.name}
                      onConfirm={deleteTournamentAction.bind(null, t.id)}
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
