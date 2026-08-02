"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Match, Team, Tournament, Player } from "@/lib/types"
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

interface MatchDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  match?: MatchWithTeams | Match
  tournaments: Tournament[]
  teams: Team[]
  players: Player[]
}

export function MatchDialog({
  children,
  action,
  match,
  tournaments,
  teams,
  players,
}: MatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [tournamentId, setTournamentId] = useState(
    "tournamentId" in (match ?? {}) ? (match as Match).tournamentId ?? "" : ""
  )
  const [homeTeamId, setHomeTeamId] = useState(
    "homeTeamId" in (match ?? {}) ? (match as Match).homeTeamId ?? "" : ""
  )
  const [awayTeamId, setAwayTeamId] = useState(
    "awayTeamId" in (match ?? {}) ? (match as Match).awayTeamId ?? "" : ""
  )
  const [status, setStatus] = useState(
    "status" in (match ?? {}) ? (match as Match).status ?? "scheduled" : "scheduled"
  )
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const isEditing = !!match

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Partido" : "Nuevo Partido"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Edit mode: hidden ID */}
          {isEditing && (
            <input type="hidden" name="id" value={(match as Match).id} />
          )}

          {/* Tournament (only for new matches) */}
          {!isEditing && (
            <div className="flex flex-col gap-1.5">
              <Label>Torneo</Label>
              <Select
                value={tournamentId}
                onValueChange={(v) => v && setTournamentId(v)}
                name="tournamentId"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar torneo" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Home Team */}
          <div className="flex flex-col gap-1.5">
            <Label>Equipo Local</Label>
            <Select
              value={homeTeamId}
              onValueChange={(v) => v && setHomeTeamId(v)}
              name="homeTeamId"
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

          {/* Away Team */}
          <div className="flex flex-col gap-1.5">
            <Label>Equipo Visitante</Label>
            <Select
              value={awayTeamId}
              onValueChange={(v) => v && setAwayTeamId(v)}
              name="awayTeamId"
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

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  "date" in (match ?? {}) ? (match as Match).date ?? "" : ""
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="time">Horario</Label>
              <Input
                id="time"
                name="time"
                type="time"
                defaultValue={
                  "time" in (match ?? {}) ? (match as Match).time ?? "" : ""
                }
                required
              />
            </div>
          </div>

          {/* Matchday */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matchday">Jornada</Label>
            <Input
              id="matchday"
              name="matchday"
              type="number"
              min={1}
              defaultValue={
                "matchday" in (match ?? {})
                  ? (match as Match).matchday?.toString() ?? ""
                  : ""
              }
              placeholder="Ej: 1"
              required
            />
          </div>

          {/* Venue */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="venue">Cancha / Estadio</Label>
            <Input
              id="venue"
              name="venue"
              defaultValue={
                "venue" in (match ?? {})
                  ? (match as Match).venue ?? ""
                  : ""
              }
              placeholder="Ej: Estadio Cubierto Municipal"
            />
          </div>

          {/* Score & Status (edit mode) */}
          {isEditing && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="homeScore">Goles Local</Label>
                  <Input
                    id="homeScore"
                    name="homeScore"
                    type="number"
                    min={0}
                    defaultValue={
                      (match as Match).homeScore?.toString() ?? ""
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="awayScore">Goles Visitante</Label>
                  <Input
                    id="awayScore"
                    name="awayScore"
                    type="number"
                    min={0}
                    defaultValue={
                      (match as Match).awayScore?.toString() ?? ""
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Estado</Label>
                <Select
                  value={status}
                  onValueChange={(v) => v && setStatus(v as Match["status"])}
                  name="status"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="ongoing">En juego</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Red cards — only when editing an existing match */}
          {isEditing && (
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Label>Tarjetas Rojas</Label>
              <p className="text-xs text-muted-foreground">
                Seleccioná los jugadores que recibieron tarjeta roja en este partido
              </p>
              <select
                multiple
                name="redCards"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px]"
              >
                {players
                  .filter(
                    (p) => p.teamId === homeTeamId || p.teamId === awayTeamId
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.number}) —{" "}
                      {teams.find((t) => t.id === p.teamId)?.shortName}
                    </option>
                  ))}
              </select>
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
