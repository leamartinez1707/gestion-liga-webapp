"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { PhotoAlbum, Series } from "@/lib/types"
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
import { Textarea } from "@/components/ui/textarea"
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

import type { MatchOption } from "@/lib/db/match-options"

interface AlbumDialogProps {
  children: React.ReactElement
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean } | undefined>
  album?: PhotoAlbum
  series: Series[]
  matches: MatchOption[]
}

export function AlbumDialog({ children, action, album, series, matches }: AlbumDialogProps) {
  const [open, setOpen] = useState(false)
  const [seriesId, setSeriesId] = useState(album?.seriesId ?? "null")
  const [matchId, setMatchId] = useState(album?.matchId ?? "null")
  const [published, setPublished] = useState(album?.published ?? true)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) setOpen(false)

  const seriesItems = [{ value: "null", label: "Toda la liga" }, ...series.map((s) => ({ value: s.id, label: s.name }))]
  const matchItems = [{ value: "null", label: "Ninguno" }, ...matches]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{album ? "Editar álbum" : "Nuevo álbum"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={album?.title ?? ""} placeholder="Ej: Fecha 3 · Serie 1" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={album?.date ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Serie</Label>
              <Select items={seriesItems} value={seriesId} onValueChange={(v) => v && setSeriesId(v)} name="seriesId">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seriesItems.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Partido (opcional)</Label>
            <Select items={matchItems} value={matchId} onValueChange={(v) => v && setMatchId(v)} name="matchId">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {matchItems.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Si elegís un partido, las fotos aparecen en la ficha de los dos equipos.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea id="description" name="description" defaultValue={album?.description ?? ""} rows={2} />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="published" className="cursor-pointer text-sm">Publicado (visible en el sitio)</Label>
          </div>
          <input type="hidden" name="published" value={published ? "true" : "false"} />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
