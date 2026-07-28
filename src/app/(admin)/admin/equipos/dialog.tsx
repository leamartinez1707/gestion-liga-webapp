"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Team } from "@/lib/types"
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

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

interface TeamDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  team?: Team
}

export function TeamDialog({ children, action, team }: TeamDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {team ? "Editar Equipo" : "Nuevo Equipo"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={team?.name ?? ""}
              placeholder="Ej: Club Atlético Los Pumas"
              required
            />
          </div>

          {/* Short name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shortName">Nombre corto</Label>
            <Input
              id="shortName"
              name="shortName"
              defaultValue={team?.shortName ?? ""}
              placeholder="Ej: Los Pumas"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              name="category"
              defaultValue={team?.category ?? ""}
              placeholder="Ej: Primera División"
              required
            />
          </div>

          {/* Coach */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coach">Director Técnico</Label>
            <Input
              id="coach"
              name="coach"
              defaultValue={team?.coach ?? ""}
              placeholder="Ej: Carlos Rodríguez"
            />
          </div>

          {/* Assistant coach */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assistantCoach">Ayudante de campo</Label>
            <Input
              id="assistantCoach"
              name="assistantCoach"
              defaultValue={team?.assistantCoach ?? ""}
              placeholder="Ej: Martín Gómez"
            />
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
