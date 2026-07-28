import { Plus, Trash2 } from "lucide-react"

import { getSanctions } from "@/lib/db/sanctions"
import { getPlayers } from "@/lib/db/players"
import { getTeams } from "@/lib/db/teams"
import {
  createSanctionAction,
  deleteSanctionAction,
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
import { SanctionDialog } from "./dialog"
import { SanctionsFilter } from "./filter"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

const cardTypeLabels: Record<string, { label: string; variant: "default" | "destructive" }> = {
  yellow: { label: "Amarilla", variant: "default" },
  red: { label: "Roja", variant: "destructive" },
}

export default async function SancionesPage(props: {
  searchParams?: Promise<{ status?: string }>
}) {
  const searchParams = await props.searchParams
  const statusFilter = searchParams?.status

  const sanctions = await getSanctions()
  const players = await getPlayers()
  const teams = await getTeams()

  const teamMap = new Map(teams.map((t) => [t.id, t.name]))
  const playerTeamMap = new Map(players.map((p) => [p.id, p.teamId]))

  // Enrich sanctions with team info
  const enriched = sanctions.map((s) => ({
    ...s,
    teamName: teamMap.get(playerTeamMap.get(s.playerId) ?? "") ?? "—",
  }))

  // Filter by status
  const filtered = statusFilter === "active"
    ? enriched.filter((s) => s.expiresAfterMatch && s.expiresAfterMatch > 0)
    : statusFilter === "completed"
      ? enriched.filter((s) => !s.expiresAfterMatch || s.expiresAfterMatch <= 0)
      : enriched

  const showCreateButton = players.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sanciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las sanciones y suspensiones de jugadores
          </p>
        </div>
        {showCreateButton && (
          <SanctionDialog
            action={createSanctionAction}
            players={players}
            teams={teams}
          >
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva Sanción
            </Button>
          </SanctionDialog>
        )}
      </div>

      {/* Filter */}
      <SanctionsFilter currentStatus={statusFilter} />

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Partidos Suspendido</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-16 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay sanciones registradas.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const ct = cardTypeLabels[s.cardType] ?? cardTypeLabels.yellow
              const isActive =
                s.expiresAfterMatch !== null && s.expiresAfterMatch > 0

              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.playerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.teamName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ct.variant}
                      className="text-xs"
                    >
                      {ct.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.matchDate
                      ? new Date(s.matchDate + "T12:00:00").toLocaleDateString("es-AR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.matchesSuspended > 0
                      ? `${s.matchesSuspended} partido(s)`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {isActive ? "Activa" : "Cumplida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteConfirmDialog
                      itemName={`sanción a ${s.playerName}`}
                      onConfirm={deleteSanctionAction.bind(null, s.id)}
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
