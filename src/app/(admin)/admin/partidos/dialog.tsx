"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Match, Team, Tournament, Player, Registration } from "@/lib/types"
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

const statusItems = [
  { value: "scheduled", label: "Programado" },
  { value: "ongoing", label: "En juego" },
  { value: "finished", label: "Finalizado" },
  { value: "postponed", label: "Suspendido (a reprogramar)" },
  { value: "cancelled", label: "Cancelado" },
]

const resultItems = [
  { value: "normal", label: "Resultado normal" },
  { value: "wo_home", label: "W.O. — gana el local (3-0)" },
  { value: "wo_away", label: "W.O. — gana el visitante (0-3)" },
]

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
  registrations: Registration[]
  players: Player[]
  /** Preselect the tournament when adding a match from a tournament page */
  defaultTournamentId?: string
}

export function MatchDialog({
  children,
  action,
  match,
  tournaments,
  teams: allTeams,
  registrations,
  players,
  defaultTournamentId,
}: MatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [tournamentId, setTournamentId] = useState(
    "tournamentId" in (match ?? {}) ? (match as Match).tournamentId ?? "" : defaultTournamentId ?? ""
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
  const [result, setResult] = useState(
    match && "walkover" in match && match.walkover
      ? (match.homeScore ?? 0) > (match.awayScore ?? 0) ? "wo_home" : "wo_away"
      : "normal"
  )
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const isEditing = !!match

  // Only teams entered in the selected tournament can play it
  const registeredIds = new Set(
    registrations.filter((r) => r.tournamentId === tournamentId && !r.withdrawnAt).map((r) => r.teamId)
  )
  const teams = tournamentId ? allTeams.filter((t) => registeredIds.has(t.id)) : allTeams

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
                onValueChange={(v) => {
                  if (!v || v === tournamentId) return
                  setTournamentId(v)
                  setHomeTeamId("")
                  setAwayTeamId("")
                }}
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
                required={!isEditing}
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
                required={!isEditing}
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
              <div className="flex flex-col gap-1.5">
                <Label>Estado</Label>
                <Select
                  items={statusItems}
                  value={status}
                  onValueChange={(v) => v && setStatus(v as Match["status"])}
                  name="status"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Resultado</Label>
                <Select
                  items={resultItems}
                  value={result}
                  onValueChange={(v) => v && setResult(v)}
                  name="result"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resultItems.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {result !== "normal" && (
                  <p className="text-xs text-muted-foreground">
                    Se carga 3-0 y el partido queda finalizado. No se registran goleadores.
                  </p>
                )}
              </div>

              {result === "normal" && (
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
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Nota pública (opcional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={(match as Match).notes ?? ""}
                  placeholder="Ej: Suspendido por lluvia"
                />
              </div>
            </>
          )}

          {/* Red cards — only when editing an existing match */}
          {isEditing && (
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Label>Tarjetas Rojas</Label>
              <p className="text-xs text-muted-foreground">
                Seleccioná los jugadores que recibieron tarjeta roja
              </p>
              <select
                multiple
                name="redCards"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
              >
                {players
                  .filter((p) => p.teamId === homeTeamId || p.teamId === awayTeamId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.number}) — {teams.find((t) => t.id === p.teamId)?.shortName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Goals — only when editing (a W.O. has no scorers) */}
          {isEditing && match && result === "normal" && (
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Label>Goles</Label>
              <p className="text-xs text-muted-foreground">
                Registrar quiénes hicieron los goles y cuántos
              </p>
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      name="goalPlayer"
                      defaultValue="none"
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="none">— Sin jugador —</option>
                      {players
                        .filter((p) => p.teamId === homeTeamId || p.teamId === awayTeamId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (#{p.number})
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      name="goalCount"
                      defaultValue={i === 0 ? 1 : 0}
                      min={0}
                      max={10}
                      className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-center"
                      placeholder="Goles"
                    />
                  </div>
                ))}
              </div>
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
