"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil, Trash2 } from "lucide-react"

import type { Player } from "@/lib/types"
import { updatePlayerAction, deletePlayerAction } from "@/lib/actions/admin"
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
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const positions = [
  { value: "arquero", label: "Arquero" },
  { value: "defensa", label: "Defensa" },
  { value: "mediocampista", label: "Mediocampista" },
  { value: "delantero", label: "Delantero" },
]

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

export function PlayerRow({ player, teamId }: { player: Player; teamId: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(player.position)
  const action = updatePlayerAction.bind(null, player.id)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) setOpen(false)

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {player.number > 0 && (
              <span className="text-muted-foreground mr-1.5">#{player.number}</span>
            )}
            {player.name}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{player.position}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Edit dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="icon-sm" aria-label="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar {player.name}</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="teamId" value={teamId} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" defaultValue={player.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" name="number" type="number" defaultValue={player.number} />
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
                <ImageUpload name="photo" currentUrl={player.photo} />
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <div className="flex justify-end pt-2">
                <SubmitButton />
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <DeleteConfirmDialog
          itemName={player.name}
          onConfirm={deletePlayerAction.bind(null, player.id)}
        >
          <Button variant="ghost" size="icon-sm" aria-label="Eliminar" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DeleteConfirmDialog>
      </div>
    </div>
  )
}
