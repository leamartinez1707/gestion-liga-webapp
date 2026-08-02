"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Tournament } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formats = [
  { value: "league", label: "Liga" },
  { value: "elimination", label: "Eliminatoria" },
  { value: "groups", label: "Grupos" },
]

// ---------------------------------------------------------------------------
// Submit button with loading state
// ---------------------------------------------------------------------------
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TournamentDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  tournament?: Tournament
}

// ---------------------------------------------------------------------------
// Tournament form dialog
// ---------------------------------------------------------------------------
export function TournamentDialog({
  children,
  action,
  tournament,
}: TournamentDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState(tournament?.format ?? "league")
  const [state, formAction] = useActionState(action, undefined)

  // Close dialog on success
  if (state?.success && open) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tournament ? "Editar Torneo" : "Nuevo Torneo"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={tournament?.name ?? ""}
              placeholder="Ej: Liga Metropolitana 2026"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              name="category"
              defaultValue={tournament?.category ?? ""}
              placeholder="Ej: Primera División"
              required
            />
          </div>

          {/* Season */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season">Temporada</Label>
            <Input
              id="season"
              name="season"
              defaultValue={tournament?.season ?? ""}
              placeholder="Ej: 2026"
              required
            />
          </div>

          {/* Format (Base UI Select) */}
          <div className="flex flex-col gap-1.5">
            <Label>Formato</Label>
            <Select
              value={format}
              onValueChange={(v) => v && setFormat(v)}
              name="format"
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start / End date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Fecha inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={tournament?.startDate ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">Fecha fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={tournament?.endDate ?? ""}
              />
            </div>
          </div>

          {/* Error */}
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
