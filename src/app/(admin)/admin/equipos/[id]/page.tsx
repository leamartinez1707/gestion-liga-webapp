import { notFound } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

import { getTeam } from "@/lib/db/teams"
import { getPlayersByTeam } from "@/lib/db/players"
import { getTeamDelegates } from "@/lib/db/users"
import { unassignDelegateAction } from "@/lib/actions/users"
import { CreateUserDialog } from "../../usuarios/user-dialogs"
import { AssignDelegateForm } from "./assign-delegate-form"
import {
  updateTeamAction,
  deletePlayerAction,
} from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { TeamEditForm } from "./edit-form"
import { AddPlayerInline } from "./add-player"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const positionLabels: Record<string, string> = {
  arquero: "Arquero",
  defensa: "Defensa",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
}

export default async function EquipoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: team, error: teamError } = await getTeam(id)
  if (teamError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-sm font-medium">{teamError}</p>
      </div>
    )
  }
  if (!team) notFound()

  const { data: players, error: playersError } = await getPlayersByTeam(id)
  const playersList = players ?? []

  const delegates = await getTeamDelegates(id)

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/admin/equipos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a equipos
      </Link>

      {/* Team info form */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Información del equipo</h2>
        <TeamEditForm team={team} action={updateTeamAction.bind(null, id)} />
      </div>

      {/* Delegates (up to 2): they manage the squad and the lista de buena fe */}
      <div className="rounded-xl border border-border p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Delegados</h2>
            <p className="text-sm text-muted-foreground">Hasta 2 por equipo. Gestionan el plantel y la lista de buena fe.</p>
          </div>
          {delegates.length < 2 && (
            <CreateUserDialog teams={[{ id: team.id, name: team.name }]} canManageAdmins={false} defaultRole="delegate" defaultTeamId={team.id}>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Crear delegado</Button>
            </CreateUserDialog>
          )}
        </div>

        {delegates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este equipo todavía no tiene delegado.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {delegates.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">{d.email}</span>
                <DeleteConfirmDialog
                  itemName={d.email}
                  title="Quitar delegado"
                  description={`${d.email} deja de gestionar ${team.name}. La cuenta no se borra.`}
                  confirmLabel="Quitar"
                  pendingLabel="Quitando…"
                  onConfirm={unassignDelegateAction.bind(null, d.id)}
                >
                  <Button variant="ghost" size="sm" className="text-destructive">Quitar</Button>
                </DeleteConfirmDialog>
              </li>
            ))}
          </ul>
        )}

        {delegates.length < 2 && (
          <AssignDelegateForm teamId={id} />
        )}
      </div>

      {/* Squad management */}
      <div className="rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Plantel</h2>
            <p className="text-sm text-muted-foreground">
              {playersList.length} jugador{playersList.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Add player form */}
        <div className="border-b border-border px-6 py-4">
          <AddPlayerInline teamId={id} />
        </div>

        {/* Players list */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Posición</TableHead>
              <TableHead className="w-20 text-center">Estado</TableHead>
              <TableHead className="w-16 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playersList.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sin jugadores en el plantel.
                </TableCell>
              </TableRow>
            )}
            {playersList.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="text-center text-muted-foreground">
                  {player.number || "—"}
                </TableCell>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {positionLabels[player.position] ?? player.position}
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
                  <DeleteConfirmDialog
                    itemName={player.name}
                    onConfirm={deletePlayerAction.bind(null, player.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Eliminar jugador"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DeleteConfirmDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
