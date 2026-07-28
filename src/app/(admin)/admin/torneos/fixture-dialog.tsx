"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Team } from "@/lib/types"
import type { FixtureMatch } from "@/lib/db/fixtures"
import { generateRoundRobin } from "@/lib/db/fixtures"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-1.5">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando…
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          Confirmar y Guardar
        </>
      )}
    </Button>
  )
}

interface FixtureDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  tournamentId: string
  tournamentName: string
  teams: Team[]
}

export function FixtureDialog({
  children,
  action,
  tournamentId,
  tournamentName,
  teams,
}: FixtureDialogProps) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<FixtureMatch[] | null>(null)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const handleGeneratePreview = () => {
    const teamIds = teams.map((t) => t.id)
    const fixtures = generateRoundRobin(teamIds)
    setPreview(fixtures)
  }

  const matchesByMatchday = preview
    ? preview.reduce(
        (acc, m) => {
          if (!acc[m.matchday]) acc[m.matchday] = []
          acc[m.matchday].push(m)
          return acc
        },
        {} as Record<number, FixtureMatch[]>
      )
    : {}

  const teamMap = new Map(teams.map((t) => [t.id, { name: t.name, shortName: t.shortName }]))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Fixture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Torneo: <span className="font-medium text-foreground">{tournamentName}</span>
          </p>

          {teams.length < 2 && (
            <p className="text-sm text-destructive">
              Se necesitan al menos 2 equipos asignados al torneo para generar el fixture.
            </p>
          )}

          {teams.length >= 2 && !preview && (
            <Button onClick={handleGeneratePreview} variant="outline" className="gap-1.5">
              Previsualizar Fixture
            </Button>
          )}

          {preview && (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {preview.length} partidos en{" "}
                  {Object.keys(matchesByMatchday).length} jornadas
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(null)}
                  className="text-xs text-muted-foreground"
                >
                  Volver a generar
                </Button>
              </div>

              {Object.entries(matchesByMatchday).map(([matchday, matches]) => (
                <div key={matchday} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha {matchday}
                  </p>
                  <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2">
                    {matches.map((m, idx) => {
                      const home = teamMap.get(m.homeTeamId)
                      const away = teamMap.get(m.awayTeamId)
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">{home?.shortName ?? home?.name ?? "?"}</span>
                          <span className="text-xs text-muted-foreground mx-2">vs</span>
                          <span className="text-muted-foreground">{away?.shortName ?? away?.name ?? "?"}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {preview && teams.length >= 2 && (
            <form action={formAction}>
              <input type="hidden" name="tournamentId" value={tournamentId} />
              <input
                type="hidden"
                name="teamIds"
                value={JSON.stringify(teams.map((t) => t.id))}
              />

              {state?.error && (
                <p className="text-sm text-destructive mb-2">{state.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <SubmitButton />
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
