"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { resizeImage } from "@/lib/resize-image"

interface ImageUploadProps {
  name: string
  currentUrl?: string | null
  className?: string
}

export function ImageUpload({ name, currentUrl, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [processing, setProcessing] = useState(false)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const original = input.files?.[0]
    setError(null)

    if (!original) return

    if (!original.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.")
      input.value = ""
      return
    }

    // Shrink phone photos so the form stays under the upload limit
    setProcessing(true)
    const file = await resizeImage(original)
    setProcessing(false)

    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Probá con otra.")
      input.value = ""
      return
    }

    if (file !== original) {
      const transfer = new DataTransfer()
      transfer.items.add(file)
      input.files = transfer.files
    }

    setPreview(URL.createObjectURL(file))
  }, [])

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group w-fit">
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Eliminar imagen"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted-bg text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          {currentUrl ? (
            <ImageIcon className="h-5 w-5" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-[10px]">{processing ? "Procesando…" : "Subir"}</span>
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
