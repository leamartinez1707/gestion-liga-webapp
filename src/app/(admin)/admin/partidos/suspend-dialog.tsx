"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Tournament } from "@/lib/types"
import { suspendMatchdayAction } from "@/lib/actions/admin"
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
    <Button type="submit" disabled={pending} variant="destructive">
      {pending ? "Suspendiendo…" : "Suspender fecha"}
    </Button>
  )
}

interface SuspendMatchdayDialogProps {
  children: React.ReactElement
  tournaments: Tournament[]
}

export function SuspendMatchdayDialog({ children, tournaments }: SuspendMatchdayDialogProps) {
  const [open, setOpen] = useState(false)
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "")
  const [days, setDays] = useState("7")
  const [state, formAction] = useActionState(suspendMatchdayAction, undefined)
  if (state?.success && open) setOpen(false)

  const items = tournaments.map((t) => ({ value: t.id, label: `${t.name} (${t.season})` }))
  const shift = parseInt(days || "0", 10) > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspender fecha</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Torneo</Label>
            <Select items={items} value={tournamentId} onValueChange={(v) => v && setTournamentId(v)} name="tournamentId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un torneo" />
              </SelectTrigger>
              <SelectContent>
                {items.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="matchday">N° de fecha</Label>
              <Input id="matchday" name="matchday" type="number" min={1} placeholder="Ej: 4" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="days">Días a correr</Label>
              <Input
                id="days"
                name="days"
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {shift
              ? `Los partidos pendientes de esa fecha y de todas las siguientes se corren ${days} días. El calendario completo se desplaza.`
              : "Con 0 días, los partidos de esa fecha quedan como suspendidos para reprogramarlos a mano; el resto del calendario no cambia."}
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Motivo (se muestra al público)</Label>
            <Input id="reason" name="reason" placeholder="Ej: Suspendida por lluvia" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
