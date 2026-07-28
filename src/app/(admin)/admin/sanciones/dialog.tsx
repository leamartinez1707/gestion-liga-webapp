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

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

interface SanctionDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  players: Player[]
  teams: Team[]
}

export function SanctionDialog({
  children,
  action,
  players,
  teams,
}: SanctionDialogProps) {
  const [open, setOpen] = useState(false)
  const [playerId, setPlayerId] = useState("")
  const [cardType, setCardType] = useState("yellow")
  const [state, formAction] = useActionState(action, undefined)

  // Filter players by selected team
  const [teamFilter, setTeamFilter] = useState("")
  const filteredPlayers = teamFilter
    ? players.filter((p) => p.teamId === teamFilter)
    : players

  const teamMap = new Map(teams.map((t) => [t.id, t.name]))

  if (state?.success && open) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Sanción</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Team filter for easier player selection */}
          <div className="flex flex-col gap-1.5">
            <Label>Equipo (filtro)</Label>
            <Select
              value={teamFilter}
              onValueChange={(v) => {
                setTeamFilter(v ?? "all")
                setPlayerId("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los equipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player */}
          <div className="flex flex-col gap-1.5">
            <Label>Jugador</Label>
            <Select
              value={playerId}
              onValueChange={(v) => v && setPlayerId(v)}
              name="playerId"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent>
                {filteredPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({teamMap.get(p.teamId) ?? "Sin equipo"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card Type */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de Tarjeta</Label>
            <Select
              value={cardType}
              onValueChange={(v) => v && setCardType(v)}
              name="cardType"
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yellow">Amarilla</SelectItem>
                <SelectItem value="red">Roja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Match Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matchDate">Fecha del Partido</Label>
            <Input
              id="matchDate"
              name="matchDate"
              type="date"
              required
            />
          </div>

          {/* Matches Suspended */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matchesSuspended">Partidos de Suspensión</Label>
            <Input
              id="matchesSuspended"
              name="matchesSuspended"
              type="number"
              min={0}
              defaultValue={cardType === "red" ? "1" : "0"}
              placeholder="Cantidad de partidos"
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
