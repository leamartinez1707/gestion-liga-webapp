"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Division } from "@/lib/types"
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  )
}

interface DivisionDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  division?: Division
}

export function DivisionDialog({ children, action, division }: DivisionDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const isEditing = !!division

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar División" : "Nueva División"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={division?.name ?? ""}
              placeholder="Ej: División A, Zona Norte"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayOrder">Orden (opcional)</Label>
            <Input
              id="displayOrder"
              name="displayOrder"
              type="number"
              defaultValue={division?.displayOrder ?? ""}
              placeholder="Se asigna automáticamente"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton label={isEditing ? "Guardar Cambios" : "Crear División"} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
