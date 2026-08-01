"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const BUCKET = "public-images"

/**
 * Uploads an image file to Supabase Storage and returns the public URL.
 * Uses the service_role key to bypass RLS (server-only, never exposed to client).
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ext = file.name.split(".").pop() ?? "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = `${folder}/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (error) return { error: error.message }

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
  const file = formData.get(fieldName) as File | null

  if (!file || file.size === 0) {
    return { url: null }
  }

  return uploadImage(file, folder)
}
