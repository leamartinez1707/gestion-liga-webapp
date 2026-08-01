"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import type { ArticleRow } from "@/lib/db/news"
import type { Series } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"


const categories = [
  "Partidos",
  "Mercado",
  "Institucional",
  "Formación",
  "Otros",
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

interface ArticleDialogProps {
  children: React.ReactElement
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
  article?: ArticleRow
  series: Series[]
}

export function ArticleDialog({
  children,
  action,
  article,
  series,
}: ArticleDialogProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(article?.category ?? "Partidos")
  const [seriesId, setSeriesId] = useState(article?.seriesId ?? "")
  const [published, setPublished] = useState(article?.published ?? false)
  const [state, formAction] = useActionState(action, undefined)

  if (state?.success && open) {
    setOpen(false)
  }

  const isEditing = !!article

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Noticia" : "Nueva Noticia"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={article?.title ?? ""}
              placeholder="Título de la noticia"
              required
            />
          </div>

          {/* Series */}
          <div className="flex flex-col gap-1.5">
            <Label>Serie</Label>
            <Select
              value={seriesId}
              onValueChange={(v) => v && setSeriesId(v)}
              name="seriesId"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Todas las series</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La noticia aparecerá destacada en esta serie
            </p>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v)}
              name="category"
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Excerpt */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excerpt">Extracto</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              defaultValue={article?.excerpt ?? ""}
              placeholder="Breve descripción de la noticia"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={article?.content ?? ""}
              placeholder="Contenido completo de la noticia..."
              rows={6}
            />
          </div>

          {/* Image upload */}
          <div className="flex flex-col gap-1.5">
            <Label>Imagen</Label>
            <ImageUpload name="image" currentUrl={article?.imageUrl} />
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label htmlFor="published" className="cursor-pointer text-sm">
              Publicada
            </Label>
          </div>
          <input type="hidden" name="published" value={published ? "true" : "false"} />

          {/* Error */}
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
