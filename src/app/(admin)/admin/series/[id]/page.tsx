import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"

import { getSeriesById, getDivisions } from "@/lib/db/series"
import {
  createDivisionAction,
  updateDivisionAction,
  deleteDivisionAction,
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
import { DivisionDialog } from "./division-dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeriesDivisionsPage({ params }: Props) {
  const { id } = await params
  const [{ data: series, error }, { data: divisionsList }] = await Promise.all([
    getSeriesById(id),
    getDivisions(id),
  ])

  if (error || !series) {
    notFound()
  }

  const divisions = divisionsList ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Back + title */}
      <div>
        <Link
          href="/admin/series"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Series
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {series.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná las divisiones de esta serie
              {series.description && <> — {series.description}</>}
            </p>
          </div>
          <DivisionDialog action={createDivisionAction.bind(null, id)}>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva División
            </Button>
          </DivisionDialog>
        </div>
      </div>

      {/* Divisions table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No hay divisiones. Creá la primera (ej: "División A").
                </TableCell>
              </TableRow>
            )}
            {divisions.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {d.displayOrder}
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DivisionDialog
                      action={updateDivisionAction.bind(null, d.id, id)}
                      division={d}
                    >
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DivisionDialog>
                    <DeleteConfirmDialog
                      itemName={d.name}
                      onConfirm={deleteDivisionAction.bind(null, d.id, id)}
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
