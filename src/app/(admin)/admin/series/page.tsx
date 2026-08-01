import Link from "next/link"
import { Plus, Pencil, Trash2, List } from "lucide-react"

import { getSeries, getDivisions } from "@/lib/db/series"
import {
  createSeriesAction,
  updateSeriesAction,
  deleteSeriesAction,
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
import { SeriesDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

export default async function SeriesPage() {
  const [{ data: seriesList, error }, { data: divisionsList }] = await Promise.all([
    getSeries(),
    getDivisions(),
  ])

  const divisions = divisionsList ?? []

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  const list = seriesList ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Series
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las series (F11, F8, Futsal) y sus divisiones
          </p>
        </div>
        <SeriesDialog action={createSeriesAction}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nueva Serie
          </Button>
        </SeriesDialog>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Divisiones</TableHead>
              <TableHead className="w-40 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No hay series. Creá la primera (ej: "Fútbol 11", "Futsal").
                </TableCell>
              </TableRow>
            )}
            {list.map((s) => {
              const divCount = divisions.filter((d) => d.seriesId === s.id).length
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {s.slug}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {divCount} {divCount === 1 ? "división" : "divisiones"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/series/${s.id}`}>
                        <Button variant="ghost" size="icon-sm" aria-label="Gestionar divisiones" title="Divisiones">
                          <List className="h-4 w-4" />
                        </Button>
                      </Link>
                      <SeriesDialog
                        action={updateSeriesAction.bind(null, s.id)}
                        series={s}
                      >
                        <Button variant="ghost" size="icon-sm" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </SeriesDialog>
                      <DeleteConfirmDialog
                        itemName={s.name}
                        onConfirm={deleteSeriesAction.bind(null, s.id)}
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
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
