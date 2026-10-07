"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Search } from "lucide-react"

import type { Team } from "@/lib/types"
import { normalize } from "@/lib/text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PhotoAvatar } from "@/components/photo-avatar"
import { cn } from "@/lib/utils"

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={count === 0 || pending} className="gap-1.5">
      <Plus className="h-4 w-4" />
      {pending ? "Inscribiendo…" : count > 1 ? `Inscribir ${count} equipos` : "Inscribir"}
    </Button>
  )
}

interface RegisterFormProps {
  /** Teams not yet entered in this tournament */
  teams: Team[]
  /** Teams that played earlier tournaments of this series and division */
  previousIds: string[]
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

/** Search the clubs, tick one or several and enter them at once. */
export function RegisterForm({ teams, previousIds, action }: RegisterFormProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [onlyPrevious, setOnlyPrevious] = useState(previousIds.length > 0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [state, formAction] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await action(prev, formData)
    if (result.success) {
      setSelected(new Set())
      setOpen(false)
    }
    return result
  }, undefined)
  const previous = useMemo(() => new Set(previousIds), [previousIds])

  const term = normalize(q.trim())
  const shown = teams.filter(
    (t) =>
      (!onlyPrevious || previous.has(t.id)) &&
      (!term || normalize(t.name).includes(term) || normalize(t.shortName ?? "").includes(term))
  )
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button className="w-fit gap-1.5" disabled={teams.length === 0}>
              <Plus className="h-4 w-4" />
              {teams.length ? "Inscribir equipos" : "Todos los equipos están inscriptos"}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inscribir equipos</DialogTitle>
            <DialogDescription>Buscá y marcá uno o varios equipos.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex min-h-0 flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre" className="pl-8" autoFocus aria-label="Buscar equipo" />
            </div>
            {previousIds.length > 0 && (
              <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
                {[
                  { value: true, label: "Jugaron en esta división" },
                  { value: false, label: "Todos" },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setOnlyPrevious(o.value)}
                    className={cn("flex-1 rounded-md px-2 py-1.5 font-medium", onlyPrevious === o.value ? "bg-background shadow-sm" : "text-muted-foreground")}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            <ul className="max-h-[45dvh] divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {shown.map((t) => (
                <li key={t.id}>
                  <label className={cn("flex cursor-pointer items-center gap-3 px-3 py-2", selected.has(t.id) && "bg-primary/5")}>
                    <input type="checkbox" name="teamId" value={t.id} checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="size-4 accent-primary" />
                    <PhotoAvatar src={t.shield} name={t.name} className="size-7" fallbackClassName="text-[9px]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                    {t.category && <span className="shrink-0 text-xs text-muted-foreground">{t.category}</span>}
                  </label>
                </li>
              ))}
              {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ningún equipo coincide.</li>}
            </ul>
            {/* Ticked teams hidden by the search are still sent */}
            {[...selected].filter((id) => !shown.some((t) => t.id === id)).map((id) => (
              <input key={id} type="hidden" name="teamId" value={id} />
            ))}

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{selected.size ? `${selected.size} marcados` : `${shown.length} equipos`}</span>
              <SubmitButton count={selected.size} />
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {!open && state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  )
}
