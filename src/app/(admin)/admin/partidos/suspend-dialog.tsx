"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { CalendarX } from "lucide-react"

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

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} variant="destructive">
      {pending ? "Suspendiendo…" : "Suspender Fecha"}
    </Button>
  )
}

export function SuspendMatchdayDialog({ children }: { children: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(suspendMatchdayAction, undefined)

  if (state?.success && open) setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspender Fecha</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Todos los partidos desde la fecha indicada se correrán la cantidad de días especificada. Las fechas siguientes también se desplazan.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matchday">N° de Fecha</Label>
            <Input id="matchday" name="matchday" type="number" placeholder="Ej: 4" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="days">Días a correr</Label>
            <Input id="days" name="days" type="number" defaultValue={7} placeholder="7" />
            <p className="text-xs text-muted-foreground">Por defecto 7 días (una semana)</p>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-success">Fecha suspendida correctamente.</p>}

          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
