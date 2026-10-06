"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { Player } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PhotoAvatar } from "@/components/photo-avatar"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar lista"}
    </Button>
  )
}

interface RosterDialogProps {
  children: React.ReactElement
  /** e.g. "Los Pumas · Serie 1 · División A (2026)" */
  title: string
  players: Player[]
  selectedIds: string[]
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

/** Lista de buena fe: check the club's players enabled for one tournament. */
export function RosterDialog({ children, title, players, selectedIds, action }: RosterDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(action, undefined)
  const [checked, setChecked] = useState(() => new Set(selectedIds))

  if (state?.success && open) setOpen(false)

  const activePlayers = players.filter((p) => p.active).sort((a, b) => a.number - b.number)

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lista de buena fe</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {activePlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              El equipo no tiene jugadores activos. Cargalos primero en el plantel.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {checked.size} de {activePlayers.length} seleccionados
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  onClick={() =>
                    setChecked(
                      checked.size === activePlayers.length
                        ? new Set()
                        : new Set(activePlayers.map((p) => p.id))
                    )
                  }
                >
                  {checked.size === activePlayers.length ? "Quitar todos" : "Elegir todos"}
                </Button>
              </div>
              <ul className="max-h-[50vh] overflow-y-auto divide-y divide-border rounded-md border border-border">
                {activePlayers.map((p) => (
                  <li key={p.id}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted-bg">
                      <input
                        type="checkbox"
                        name="playerIds"
                        value={p.id}
                        checked={checked.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="size-4 accent-primary"
                      />
                      <PhotoAvatar src={p.photo} name={p.name} className="size-8" fallbackClassName="text-xs" />
                      <span className="text-sm font-medium flex-1">
                        {p.number > 0 && <span className="text-muted-foreground mr-1.5">#{p.number}</span>}
                        {p.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
