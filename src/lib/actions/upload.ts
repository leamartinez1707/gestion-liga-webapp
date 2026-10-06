// Server-only helpers used by the Server Actions in admin.ts / delegate.ts.
// Intentionally NOT a "use server" module: exporting these as Server Actions
// would make them callable by anyone via a direct POST.

import { createClient } from "@/lib/supabase/server"

const BUCKET = "public-images"
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

/**
 * Uploads an image to Supabase Storage with the signed-in user's session,
 * so the storage RLS policies decide who may upload. Returns the public URL.
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url?: string; error?: string }> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return { error: "Formato de imagen no permitido. Usá PNG, JPG o WEBP." }
  if (file.size > MAX_BYTES) return { error: "La imagen no puede superar los 5 MB." }

  try {
    const supabase = await createClient()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = `${folder}/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", contentType: file.type })

    if (error) return { error: "No se pudo subir la imagen." }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return { url: publicUrl }
  } catch {
    return { error: "No se pudo subir la imagen." }
  }
}

/**
 * Extracts a File from FormData, uploads it, and returns the URL.
 * Returns null if no file was provided (no error — optional field).
 */
export async function uploadOptionalImage(
  formData: FormData,
  fieldName: string,
  folder: string
): Promise<{ url?: string | null; error?: string }> {
  const file = formData.get(fieldName)

  if (!(file instanceof File) || file.size === 0) {
    return { url: null }
  }

  return uploadImage(file, folder)
}
