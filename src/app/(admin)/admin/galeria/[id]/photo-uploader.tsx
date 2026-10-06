"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { resizeImage } from "@/lib/resize-image"
import { addPhotosAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"

const BUCKET = "public-images"
const MAX_FILES = 60
const CONCURRENCY = 3

/**
 * Uploads straight from the browser to Supabase Storage with the admin's
 * session (storage RLS: staff only), so there's no request-size limit, then
 * records the URLs with a Server Action.
 */
export function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(fileList: FileList | null) {
    const files = [...(fileList ?? [])].filter((f) => f.type.startsWith("image/"))
    if (inputRef.current) inputRef.current.value = ""
    if (files.length === 0) return
    if (files.length > MAX_FILES) {
      setError(`Subí hasta ${MAX_FILES} fotos por vez.`)
      return
    }

    setError(null)
    setProgress({ done: 0, total: files.length })
    const supabase = createClient()
    const uploaded: ({ url: string; thumbUrl: string | null } | undefined)[] = new Array(files.length)
    let failed = 0
    let done = 0

    async function put(file: File, path: string): Promise<string | null> {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", contentType: file.type })
      return uploadError ? null : supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    }

    // Two sizes per photo: full for the viewer, thumbnail for the grids
    async function uploadOne(file: File, index: number) {
      const [full, thumb] = await Promise.all([resizeImage(file, 2000), resizeImage(file, 480)])
      const ext = (f: File) => (f.type === "image/webp" ? "webp" : f.type === "image/png" ? "png" : "jpg")
      const base = `gallery/${albumId}/${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
      const [url, thumbUrl] = await Promise.all([put(full, `${base}.${ext(full)}`), put(thumb, `${base}-thumb.${ext(thumb)}`)])
      if (!url) failed++
      else uploaded[index] = { url, thumbUrl }
      done++
      setProgress({ done, total: files.length })
    }

    // A few at a time: fast on wifi, gentle on mobile data
    let next = 0
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
        while (next < files.length) {
          const i = next++
          await uploadOne(files[i], i)
        }
      })
    )

    const photos = uploaded.filter((p) => p !== undefined)
    if (photos.length > 0) {
      const result = await addPhotosAction(albumId, photos)
      if (result.error) setError(result.error)
    }
    if (failed > 0) setError(`No se pudieron subir ${failed} ${failed === 1 ? "foto" : "fotos"}. Probá de nuevo.`)

    setProgress(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        className="gap-1.5 w-fit"
      >
        <Upload className="h-4 w-4" />
        {progress ? `Subiendo ${progress.done} de ${progress.total}…` : "Subir fotos"}
      </Button>
      {progress && (
        <div className="h-1.5 w-full max-w-sm rounded-full bg-muted-bg overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
