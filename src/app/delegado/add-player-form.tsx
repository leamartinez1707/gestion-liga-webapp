"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"

import { createPlayerAction } from "@/lib/actions/admin"
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
import { ImageUpload } from "@/components/ui/image-upload"

const positions = [
  { value: "arquero", label: "Arquero" },
  { value: "defensa", label: "Defensa" },
  { value: "mediocampista", label: "Mediocampista" },
  { value: "delantero", label: "Delantero" },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Agregando…" : "Agregar Jugador"}
    </Button>
  )
}

export function AddPlayerForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState("delantero")
  const [state, formAction] = useActionState(createPlayerAction, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Jugador</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="teamId" value={teamId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Nombre del jugador" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" type="number" placeholder="10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Posición</Label>
              <Select value={position} onValueChange={(v) => v && setPosition(v)} name="position">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Foto</Label>
            <ImageUpload name="photo" />
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
