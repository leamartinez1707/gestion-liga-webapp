"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Series } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  )
}

interface SeriesDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  series?: Series
}

export function SeriesDialog({ children, action, series }: SeriesDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const isEditing = !!series

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Serie" : "Nueva Serie"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={series?.name ?? ""}
              placeholder="Ej: Fútbol 11, Futsal, +30"
              required
            />
            <p className="text-xs text-muted-foreground">
              El slug se genera automáticamente (ej: "futbol-11")
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={series?.description ?? ""}
              placeholder="Descripción opcional de la serie"
              rows={2}
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton label={isEditing ? "Guardar Cambios" : "Crear Serie"} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
