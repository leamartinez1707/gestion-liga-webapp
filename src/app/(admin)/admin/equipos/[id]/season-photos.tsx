"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Trash2 } from "lucide-react"

import type { TeamSeasonPhoto } from "@/lib/db/team-photos"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Subiendo…" : "Guardar foto"}
    </Button>
  )
}

interface Props {
  photos: TeamSeasonPhoto[]
  /** Seasons offered in the select (the team's tournaments plus this year) */
  seasons: string[]
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onDelete: (photoId: string) => Promise<{ error?: string }>
}

/** Squad photo per season: the public team page shows it in each year's tab. */
export function SeasonPhotos({ photos, seasons, action, onDelete }: Props) {
  const [season, setSeason] = useState(seasons[0] ?? "")
  const [formKey, setFormKey] = useState(0)
  const [state, formAction] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await action(prev, formData)
    // Clear the picker after a successful upload
    if (result?.success) setFormKey((k) => k + 1)
    return result
  }, undefined)

  const existing = photos.find((p) => p.season === season)

  return (
    <div className="flex flex-col gap-5">
      <form key={formKey} action={formAction} className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Temporada</Label>
          <Select value={season} onValueChange={(v) => v && setSeason(v)} name="season">
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {seasons.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Foto del plantel</Label>
          <ImageUpload name="photo" maxSize={1600} />
          {existing && <p className="text-xs text-muted-foreground">Ya hay una foto de {season}: si subís otra, la reemplaza.</p>}
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <div><SubmitButton /></div>
      </form>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Plantel ${p.season}`} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold">{p.season}</span>
                <DeleteConfirmDialog itemName={`la foto de ${p.season}`} onConfirm={() => onDelete(p.id)}>
                  <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </DeleteConfirmDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
