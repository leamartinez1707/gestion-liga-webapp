"use client"

import { useState } from "react"
import { Check, CheckCheck, UserPlus } from "lucide-react"

import type { Player } from "@/lib/types"
import type { LineupEntry } from "@/lib/db/lineups"
import { addNewGuestAction, setLineupAction, setLineupAllAction } from "@/lib/actions/live"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhotoAvatar } from "@/components/photo-avatar"
import { cn } from "@/lib/utils"

export interface LineupTeam {
  id: string
  shortName: string
  shield: string
  /** Lista de buena fe (or the active players when the team has no list) */
  players: Player[]
  /** The club's players outside the list: possible refuerzos */
  others: Player[]
  hasList: boolean
}

interface Props {
  matchId: string
  teams: LineupTeam[]
  lineup: LineupEntry[]
  suspended: Set<string>
  guestRules: { allowed: boolean; maxMatches: number }
  /** playerId → cédula */
  documents: Record<string, string>
  pending: boolean
  run: (fn: () => Promise<{ error?: string; notice?: string }>, after?: () => void) => void
}

/**
 * Who plays: the referee checks each ID against this list and taps the player.
 * Refuerzos (not on the list) only when the league allows them.
 */
export function LineupPanel({ matchId, teams, lineup, suspended, guestRules, documents, pending, run }: Props) {
  const [guestTeam, setGuestTeam] = useState<LineupTeam | null>(null)
  const playing = new Map(lineup.map((l) => [l.playerId, l]))

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Pedí la cédula y tocá a cada jugador que juega, o marcá todos de una y destildá a los que faltan. Los suspendidos no se marcan.
      </p>

      {teams.map((team) => {
        const guests = team.others.filter((p) => playing.get(p.id)?.isGuest)
        const count = [...playing.values()].filter((l) => l.teamId === team.id).length
        const allMarked = team.players.length > 0 && team.players.every((p) => playing.has(p.id) || suspended.has(p.id))
        return (
          <section key={team.id} className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
              <PhotoAvatar src={team.shield} name={team.shortName} className="size-7" fallbackClassName="text-[9px]" />
              <h2 className="flex-1 truncate font-bold">{team.shortName}</h2>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{count} juegan</span>
            </div>
            {team.players.length > 0 && (
              <div className="border-b border-border p-2">
                <Button
                  variant="outline"
                  className="min-h-11 w-full gap-2"
                  disabled={pending}
                  onClick={() => run(() => setLineupAllAction(matchId, team.id, !allMarked))}
                >
                  <CheckCheck className="size-4" />
                  {allMarked ? "Desmarcar todos" : team.hasList ? "Marcar toda la lista" : "Marcar todos"}
                </Button>
              </div>
            )}

            <ul className="divide-y divide-border">
              {[...team.players, ...guests].map((p) => {
                const entry = playing.get(p.id)
                const on = !!entry
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setLineupAction(matchId, team.id, p.id, !on))}
                      className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition disabled:opacity-60", on ? "bg-success-soft" : "active:bg-muted")}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md border-2",
                          on ? "border-success bg-success text-white" : "border-border"
                        )}
                        aria-hidden
                      >
                        {on && <Check className="size-4" strokeWidth={3} />}
                      </span>
                      <span className="w-7 text-center text-lg font-black tabular-nums text-muted-foreground">{p.number > 0 ? p.number : "–"}</span>
                      <PhotoAvatar src={p.photo} name={p.name} className="size-10" fallbackClassName="text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        {documents[p.id] && <span className="block text-xs tabular-nums text-muted-foreground">CI {documents[p.id]}</span>}
                        {(entry?.isGuest || suspended.has(p.id)) && (
                          <span className="flex gap-2 text-[11px] font-semibold uppercase">
                            {entry?.isGuest && <span className="text-amber-700">Refuerzo</span>}
                            {suspended.has(p.id) && <span className="text-destructive">Suspendido</span>}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
              {team.players.length === 0 && guests.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">El equipo no tiene jugadores cargados.</li>
              )}
            </ul>

            {team.hasList && (
              <div className="border-t border-border p-2">
                {guestRules.allowed ? (
                  <Button variant="outline" className="w-full gap-2" disabled={pending} onClick={() => setGuestTeam(team)}>
                    <UserPlus className="size-4" />
                    Agregar refuerzo
                  </Button>
                ) : (
                  <p className="px-1 py-1 text-center text-xs text-muted-foreground">La liga no permite refuerzos: solo juegan los de la lista de buena fe.</p>
                )}
              </div>
            )}
          </section>
        )
      })}

      {guestTeam && (
        <GuestDialog
          team={guestTeam}
          matchId={matchId}
          playing={playing}
          maxMatches={guestRules.maxMatches}
          pending={pending}
          run={run}
          onClose={() => setGuestTeam(null)}
        />
      )}
    </div>
  )
}

function GuestDialog({
  team,
  matchId,
  playing,
  maxMatches,
  pending,
  run,
  onClose,
}: {
  team: LineupTeam
  matchId: string
  playing: Map<string, LineupEntry>
  maxMatches: number
  pending: boolean
  run: Props["run"]
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const candidates = team.others.filter((p) => !playing.has(p.id))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refuerzo · {team.shortName}</DialogTitle>
          <DialogDescription>
            Juega sin estar en la lista de buena fe.{" "}
            {maxMatches > 0 ? `Cada refuerzo puede jugar hasta ${maxMatches} ${maxMatches === 1 ? "partido" : "partidos"} por torneo.` : "Sin límite de partidos."}
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">Jugadores del club</p>
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={pending}
                onClick={() => run(() => setLineupAction(matchId, team.id, p.id, true), onClose)}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left active:bg-muted disabled:opacity-60"
              >
                <span className="w-7 text-center text-lg font-black tabular-nums text-muted-foreground">{p.number > 0 ? p.number : "–"}</span>
                <PhotoAvatar src={p.photo} name={p.name} className="size-9" fallbackClassName="text-xs" />
                <span className="flex-1 font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        )}

        <form
          className="mt-2 flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            run(() => addNewGuestAction(matchId, team.id, { name, number: parseInt(number, 10) }), onClose)
          }}
        >
          <p className="text-sm font-semibold">Jugador nuevo</p>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guest-name">Nombre y apellido</Label>
              <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guest-number">Número</Label>
              <Input id="guest-number" type="number" min={1} max={99} value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={pending || name.trim().length < 3}>Agregar y marcar que juega</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
