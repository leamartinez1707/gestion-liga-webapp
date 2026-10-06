"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Player, Team } from "@/lib/types"
import type { MatchWithTeams } from "@/lib/db/matches"
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
  /** Matches to attach the sanction to (needed to know when it ends) */
  matches: MatchWithTeams[]
}

export function SanctionDialog({
  children,
  action,
  players,
  teams,
  matches,
}: SanctionDialogProps) {
  const [open, setOpen] = useState(false)
  const [playerId, setPlayerId] = useState("")
  const [cardType, setCardType] = useState("yellow")
  const [state, formAction] = useActionState(action, undefined)

  // Filter players by selected team
  const [teamFilter, setTeamFilter] = useState("")
  const filteredPlayers = teamFilter && teamFilter !== "all"
    ? players.filter((p) => p.teamId === teamFilter)
    : players
  const [matchId, setMatchId] = useState("")

  // Matches of the selected player's team, latest first
  const playerTeamId = players.find((p) => p.id === playerId)?.teamId
  const matchItems = matches
    .filter((m) => playerTeamId && (m.homeTeamId === playerTeamId || m.awayTeamId === playerTeamId))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map((m) => ({
      value: m.id,
      label: `Fecha ${m.matchday} · ${m.homeTeamName} vs ${m.awayTeamName}${m.date ? ` (${m.date})` : ""}`,
    }))

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
              onValueChange={(v) => {
                if (!v) return
                setPlayerId(v)
                setMatchId("")
              }}
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

          {/* Match: decides the tournament and until which matchday it lasts */}
          <div className="flex flex-col gap-1.5">
            <Label>Partido</Label>
            <Select items={matchItems} value={matchId} onValueChange={(v) => v && setMatchId(v)} name="matchId" disabled={!playerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={playerId ? "Elegí el partido" : "Primero elegí el jugador"} />
              </SelectTrigger>
              <SelectContent>
                {matchItems.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Las fechas de suspensión se cuentan desde este partido, en su torneo.
            </p>
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
