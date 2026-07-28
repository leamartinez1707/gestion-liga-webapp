"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Player, Team } from "@/lib/types"
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
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

interface PlayerDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  player?: Player
  teams: Team[]
}

export function PlayerDialog({
  children,
  action,
  player,
  teams,
}: PlayerDialogProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(player?.position ?? "delantero")
  const [teamId, setTeamId] = useState(player?.teamId ?? "")
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
            {player ? "Editar Jugador" : "Nuevo Jugador"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={player?.name ?? ""}
              placeholder="Nombre del jugador"
              required
            />
          </div>

          {/* Number */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              name="number"
              type="number"
              defaultValue={player?.number ?? ""}
              placeholder="Ej: 10"
            />
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <Label>Posición</Label>
            <Select
              value={position}
              onValueChange={(v) => v && setPosition(v as Player["position"])}
              name="position"
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div className="flex flex-col gap-1.5">
            <Label>Equipo</Label>
            <Select
              value={teamId}
              onValueChange={(v) => v && setTeamId(v)}
              name="teamId"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active toggle (hidden in form, set via hidden input for edit) */}
          {player && (
            <div className="flex items-center gap-2">
              <input
                type="hidden"
                name="active"
                value={player.active ? "true" : "false"}
              />
              <span className="text-sm text-muted-foreground">
                Estado actual: {player.active ? "Activo" : "Suspendido"}
              </span>
            </div>
          )}

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
