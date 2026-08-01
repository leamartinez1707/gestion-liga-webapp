"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil } from "lucide-react"

import type { Team } from "@/lib/types"
import { updateTeamAction } from "@/lib/actions/admin"
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
import { ImageUpload } from "@/components/ui/image-upload"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar Cambios"}
    </Button>
  )
}

export function TeamEditForm({ team }: { team: Team }) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(
    updateTeamAction.bind(null, team.id),
    undefined
  )

  if (state?.success && open) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {team.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={team.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coach">Director Técnico</Label>
            <Input id="coach" name="coach" defaultValue={team.coach} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Escudo</Label>
            <ImageUpload name="shield" currentUrl={team.shield} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
