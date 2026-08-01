"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import type { Sponsor } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
}

interface Props {
  children: React.ReactElement
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  sponsor?: Sponsor
}

export function SponsorDialog({ children, action, sponsor }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(action, undefined)
  if (state?.success && open) setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader><DialogTitle>{sponsor ? "Editar Sponsor" : "Nuevo Sponsor"}</DialogTitle></DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={sponsor?.name ?? ""} placeholder="Nombre del sponsor" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <ImageUpload name="logo" currentUrl={sponsor?.logoUrl} />
            <p className="text-xs text-muted-foreground">O poné la URL manualmente:</p>
            <Input name="logoUrl" defaultValue={sponsor?.logoUrl ?? ""} placeholder="https://... o subí la imagen arriba" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkUrl">Link (opcional)</Label>
            <Input id="linkUrl" name="linkUrl" defaultValue={sponsor?.linkUrl ?? ""} placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayOrder">Orden</Label>
            <Input id="displayOrder" name="displayOrder" type="number" defaultValue={sponsor?.displayOrder ?? 0} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2"><SubmitButton /></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
