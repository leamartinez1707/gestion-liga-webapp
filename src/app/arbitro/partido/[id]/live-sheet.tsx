"use client"

import { useState, useTransition } from "react"
import { Undo2, Trash2 } from "lucide-react"

import type { Match, MatchEvent, Player } from "@/lib/types"
import { addEventAction, deleteEventAction, setLiveStateAction } from "@/lib/actions/live"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhotoAvatar } from "@/components/photo-avatar"
import type { LineupEntry } from "@/lib/db/lineups"
import { LineupPanel, type LineupTeam } from "./lineup-panel"
import { cn } from "@/lib/utils"

interface SheetTeam extends LineupTeam {
  name: string
}

interface LiveSheetProps {
  match: Match
  home: SheetTeam
  away: SheetTeam
  events: MatchEvent[]
  suspendedPlayerIds: string[]
  lineup: LineupEntry[]
  guestRules: { allowed: boolean; maxMatches: number }
  /** Futsal blue card (league setting) */
  blueCards: boolean
  /** playerId → cédula, to check IDs */
  documents: Record<string, string>
}

const EVENT_LABEL: Record<MatchEvent["type"], string> = {
  goal: "Gol",
  own_goal: "Gol en contra",
  yellow: "Amarilla",
  red: "Roja",
  blue: "Azul",
}
const EVENT_ICON: Record<MatchEvent["type"], string> = { goal: "⚽", own_goal: "⚽", yellow: "🟨", red: "🟥", blue: "🟦" }

// For a goal, a second step asks who assisted (scorerId set)
type Picking = { team: SheetTeam; type: MatchEvent["type"]; scorerId?: string } | null

export function LiveSheet({ match, home, away, events, suspendedPlayerIds, lineup, guestRules, blueCards, documents }: LiveSheetProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [picking, setPicking] = useState<Picking>(null)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const suspended = new Set(suspendedPlayerIds)
  // Before kick-off the referee starts with the lineup; then with the events
  const [tab, setTab] = useState<"jugadores" | "partido">(match.status === "scheduled" ? "jugadores" : "partido")
  const lineupIds = new Set(lineup.map((l) => l.playerId))
  // Players sent off (red or blue) can't get more cards or goals
  const expelled = new Set(events.flatMap((e) => ((e.type === "red" || e.type === "blue") && e.playerId ? [e.playerId] : [])))

  // Event picker: who's playing first (refuerzos included), then the rest of the list
  const pickable = (team: SheetTeam): Player[] => {
    const all = [...team.players, ...team.others].filter((p) => !expelled.has(p.id))
    const playing = all.filter((p) => lineupIds.has(p.id))
    const rest = team.players.filter((p) => !lineupIds.has(p.id) && !expelled.has(p.id))
    return playing.length ? [...playing, ...rest] : rest
  }

  const run = (fn: () => Promise<{ error?: string; notice?: string }>, after?: () => void) =>
    startTransition(async () => {
      setError(null)
      setNotice(null)
      const result = await fn()
      if (result.error) setError(result.error)
      else {
        if (result.notice) setNotice(result.notice)
        after?.()
      }
    })

  const addEvent = (team: SheetTeam, type: MatchEvent["type"], playerId: string | null, assistPlayerId: string | null = null) =>
    run(() => addEventAction(match.id, { teamId: team.id, playerId, assistPlayerId, type }), () => setPicking(null))

  const pickPlayer = (playerId: string) => {
    if (!picking) return
    if (picking.scorerId) addEvent(picking.team, "goal", picking.scorerId, playerId)
    else if (picking.type === "goal") setPicking({ ...picking, scorerId: playerId })
    else addEvent(picking.team, picking.type, playerId)
  }

  const setState = (status: "scheduled" | "ongoing" | "finished", period: Match["livePeriod"] | null) =>
    run(() => setLiveStateAction(match.id, status, period), () => setConfirmFinish(false))

  const finished = match.status === "finished"
  const blocked = match.status === "cancelled" || match.status === "postponed"
  const playerName = (id?: string) =>
    [...home.players, ...home.others, ...away.players, ...away.others].find((p) => p.id === id)?.name ?? "Sin identificar"
  const teamOf = (id: string) => (id === home.id ? home : away)
  const lastEvent = events[events.length - 1]

  return (
    <div className={cn("flex flex-col gap-4", pending && "opacity-70")}>
      {/* Scoreboard */}
      <div className="rounded-2xl bg-primary p-4 text-white shadow">
        <div className="flex items-center justify-between gap-2">
          <TeamHeader team={home} />
          <div className="text-center">
            <p className="text-5xl font-black tabular-nums leading-none">
              {match.homeScore ?? 0}<span className="mx-1 text-white/50">-</span>{match.awayScore ?? 0}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              {finished ? "Final" : match.status === "ongoing" ? periodLabel(match.livePeriod) : blocked ? "Suspendido" : "Sin empezar"}
            </p>
          </div>
          <TeamHeader team={away} />
        </div>
      </div>

      {/* Tabs: lineup (who plays) and the match itself */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["jugadores", "partido"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn("min-h-11 rounded-lg text-sm font-bold transition", tab === t ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t === "jugadores" ? `👕 Jugadores (${lineup.length})` : "⚽ Partido"}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
      {notice && <p className="rounded-lg bg-amber-100 p-3 text-sm font-medium text-amber-900">{notice}</p>}

      {tab === "jugadores" ? (
        blocked ? (
          <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">El partido está suspendido o cancelado.</p>
        ) : (
          <LineupPanel
            matchId={match.id}
            teams={[home, away]}
            lineup={lineup}
            suspended={suspended}
            guestRules={guestRules}
            documents={documents}
            pending={pending}
            run={run}
          />
        )
      ) : (
        <>
      {/* Match clock controls */}
      {!blocked && (
        <div className="grid">
          {match.status === "scheduled" && (
            <BigButton onClick={() => setState("ongoing", "1T")} disabled={pending}>▶ Empezar partido</BigButton>
          )}
          {match.status === "ongoing" && match.livePeriod !== "ET" && match.livePeriod !== "2T" && (
            <BigButton onClick={() => setState("ongoing", "ET")} disabled={pending}>⏸ Entretiempo</BigButton>
          )}
          {match.status === "ongoing" && match.livePeriod === "ET" && (
            <BigButton onClick={() => setState("ongoing", "2T")} disabled={pending}>▶ Empezar 2º tiempo</BigButton>
          )}
          {match.status === "ongoing" && match.livePeriod === "2T" && (
            <BigButton onClick={() => setConfirmFinish(true)} disabled={pending} tone="dark">🏁 Terminar partido</BigButton>
          )}
          {/* Referees who keep time on their watch load everything and close the match in one go */}
          {!finished && !(match.status === "ongoing" && match.livePeriod === "2T") && (
            <Button variant="outline" className="mt-2 min-h-11" onClick={() => setConfirmFinish(true)} disabled={pending}>
              🏁 Terminar partido ya (sin usar el reloj)
            </Button>
          )}
          {finished && (
            <Button variant="outline" onClick={() => setState("ongoing", "2T")} disabled={pending}>
              Reabrir partido para corregir
            </Button>
          )}
        </div>
      )}

      {/* Event buttons, one column per team */}
      {!blocked && (
        <div className="grid grid-cols-2 gap-3">
          {[home, away].map((team) => (
            <div key={team.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2">
              <p className="truncate text-center text-sm font-bold">{team.shortName}</p>
              <BigButton onClick={() => setPicking({ team, type: "goal" })} disabled={pending}>⚽ Gol</BigButton>
              <BigButton onClick={() => setPicking({ team, type: "yellow" })} disabled={pending} tone="yellow">🟨 Amarilla</BigButton>
              <BigButton onClick={() => setPicking({ team, type: "red" })} disabled={pending} tone="red">🟥 Roja</BigButton>
              {blueCards && (
                <BigButton onClick={() => setPicking({ team, type: "blue" })} disabled={pending} tone="blue">🟦 Azul</BigButton>
              )}
              <button
                type="button"
                onClick={() => setPicking({ team, type: "own_goal" })}
                disabled={pending}
                className="py-1 text-xs text-muted-foreground underline"
              >
                Gol en contra
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <section className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold">Lo cargado</h2>
          {lastEvent && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              disabled={pending}
              onClick={() => run(() => deleteEventAction(match.id, lastEvent.id))}
            >
              <Undo2 className="h-4 w-4" />
              Deshacer último
            </Button>
          )}
        </div>
        {events.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Todavía no se cargó nada.</p>
        ) : (
          <ul className="divide-y divide-border">
            {[...events].reverse().map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-lg" aria-hidden>{EVENT_ICON[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{playerName(e.playerId)}</p>
                  <p className="text-xs text-muted-foreground">
                    {EVENT_LABEL[e.type]} · {teamOf(e.teamId).shortName}{e.period && ` · ${e.period}`}
                    {e.assistPlayerId && ` · Asist.: ${playerName(e.assistPlayerId)}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Borrar"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`¿Borrar ${EVENT_LABEL[e.type].toLowerCase()} de ${playerName(e.playerId)}?`)) {
                      run(() => deleteEventAction(match.id, e.id))
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

        </>
      )}

      {/* Player picker */}
      {/* Closing on the assist step keeps the goal (without assist): never lose a goal */}
      <Dialog
        open={picking !== null}
        onOpenChange={(open) => {
          if (open || !picking) return
          if (picking.scorerId && !pending) addEvent(picking.team, "goal", picking.scorerId, null)
          else setPicking(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {picking &&
                (picking.scorerId
                  ? `¿Quién asistió a ${playerName(picking.scorerId)}?`
                  : `${EVENT_ICON[picking.type]} ${EVENT_LABEL[picking.type]} · ${picking.team.shortName}`)}
            </DialogTitle>
          </DialogHeader>
          {picking && (
            <div className="flex flex-col gap-1.5">
              {picking.scorerId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => addEvent(picking.team, "goal", picking.scorerId ?? null, null)}
                  className="mb-1 min-h-14 rounded-xl bg-primary px-3 text-base font-bold text-white disabled:opacity-60"
                >
                  Sin asistencia · guardar gol
                </button>
              )}
              {picking.type === "own_goal" && (
                <p className="text-xs text-muted-foreground">Elegí el jugador de {picking.team.shortName} que la metió en contra: el gol suma para el rival.</p>
              )}
              {pickable(picking.team).filter((p) => p.id !== picking.scorerId).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={pending}
                  onClick={() => pickPlayer(p.id)}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-left active:bg-muted-bg disabled:opacity-60"
                >
                  <span className="w-8 text-center text-lg font-black tabular-nums text-muted-foreground">
                    {p.number > 0 ? p.number : "–"}
                  </span>
                  <PhotoAvatar src={p.photo} name={p.name} className="size-9" fallbackClassName="text-xs" />
                  <span className="flex-1 text-base font-medium">{p.name}</span>
                  {suspended.has(p.id) && (
                    <span className="text-[10px] font-semibold uppercase text-destructive">Suspendido</span>
                  )}
                </button>
              ))}
              {pickable(picking.team).length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">El equipo no tiene jugadores cargados.</p>
              )}
              {!picking.scorerId && (picking.type === "goal" || picking.type === "own_goal") && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => addEvent(picking.team, picking.type, null)}
                  className="mt-1 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground"
                >
                  No sé quién fue (sumar el gol igual)
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Finish confirmation */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Terminar el partido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Queda {home.shortName} {match.homeScore ?? 0} - {match.awayScore ?? 0} {away.shortName}. Se actualiza la tabla de posiciones. Si te equivocaste, después lo podés reabrir.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>Volver</Button>
            <Button onClick={() => setState("finished", null)} disabled={pending}>Sí, terminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function periodLabel(period: Match["livePeriod"]): string {
  if (period === "ET") return "Entretiempo"
  if (period === "2T") return "2º tiempo"
  return "1er tiempo"
}

function TeamHeader({ team }: { team: SheetTeam }) {
  return (
    <div className="flex w-24 flex-col items-center gap-1.5 text-center">
      <PhotoAvatar src={team.shield} name={team.name} className="size-12 bg-white" />
      <span className="text-xs font-semibold leading-tight">{team.shortName}</span>
    </div>
  )
}

function BigButton({
  children,
  onClick,
  disabled,
  tone = "primary",
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: "primary" | "yellow" | "red" | "blue" | "dark"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-14 w-full rounded-xl px-3 text-base font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-60",
        tone === "primary" && "bg-primary text-white",
        tone === "yellow" && "bg-amber-300 text-amber-950",
        tone === "red" && "bg-red-600 text-white",
        tone === "blue" && "bg-blue-600 text-white",
        tone === "dark" && "bg-foreground text-background"
      )}
    >
      {children}
    </button>
  )
}
