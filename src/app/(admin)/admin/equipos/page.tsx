import { Plus, Pencil, Trash2, Users } from "lucide-react"
import Link from "next/link"

import { getTeams } from "@/lib/db/teams"
import { createTeamAction, deleteTeamAction } from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TeamDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

export default async function EquiposPage() {
  const teams = await getTeams()

  // Compute unique categories for filter display
  const categories = [...new Set(teams.map((t) => t.category))]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Equipos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná los equipos de la liga
          </p>
        </div>
        <TeamDialog action={createTeamAction}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo Equipo
          </Button>
        </TeamDialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Director Técnico</TableHead>
              <TableHead className="text-center">Jugadores</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay equipos todavía. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <Link
                    href={`/admin/equipos/${team.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {team.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {team.category}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {team.coach || "—"}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <span className="inline-flex items-center justify-center gap-1 text-sm">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/equipos/${team.id}`}>
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteConfirmDialog
                      itemName={team.name}
                      onConfirm={deleteTeamAction.bind(null, team.id)}
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
