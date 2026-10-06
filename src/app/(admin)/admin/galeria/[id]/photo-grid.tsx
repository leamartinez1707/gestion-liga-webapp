"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Star, Trash2 } from "lucide-react"

import type { Photo } from "@/lib/types"
import { deletePhotoAction, setAlbumCoverAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminPhotoGrid({
  albumId,
  photos,
  coverUrl,
}: {
  albumId: string
  photos: Photo[]
  coverUrl?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(null)
      const result = await fn()
      if (result.error) setError(result.error)
    })

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">El álbum no tiene fotos todavía.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className={cn("grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6", pending && "opacity-60")}>
        {photos.map((photo) => {
          const thumb = photo.thumbUrl ?? photo.url
          const isCover = coverUrl === thumb || coverUrl === photo.url
          return (
            <li key={photo.id} className="group relative aspect-square overflow-hidden rounded-md border border-border">
              <Image src={thumb} alt={photo.caption ?? ""} fill sizes="(min-width: 1024px) 16vw, 33vw" className="object-cover" />
              {isCover && (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Portada</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
                {!isCover && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    aria-label="Usar como portada"
                    disabled={pending}
                    onClick={() => run(() => setAlbumCoverAction(albumId, thumb))}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  aria-label="Eliminar foto"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("¿Eliminar esta foto?")) run(() => deletePhotoAction(photo.id))
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
