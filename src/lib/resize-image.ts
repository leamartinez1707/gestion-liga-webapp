// Browser-only: shrink photos before uploading. Phone pictures are 3–8 MB;
// Server Actions accept ~1 MB by default (Vercel caps requests at 4.5 MB),
// and a 1600px image looks the same on a phone.

const DEFAULT_MAX = 1600

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Returns a resized copy (longest side ≤ maxSize). PNGs keep transparency
 * (shields): WebP when the browser can encode it, PNG otherwise. Everything
 * else becomes JPEG. Returns the original file if it can't be decoded.
 */
export async function resizeImage(file: File, maxSize = DEFAULT_MAX): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const keepAlpha = file.type === "image/png"
  let blob: Blob | null = null
  if (keepAlpha) {
    blob = await canvasToBlob(canvas, "image/webp", 0.9)
    if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/png", 1)
  } else {
    blob = await canvasToBlob(canvas, "image/jpeg", 0.85)
  }
  if (!blob) return file

  // Already small and not resized: keep the original
  if (scale === 1 && blob.size >= file.size) return file

  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg"
  const base = file.name.replace(/\.[^.]+$/, "") || "foto"
  return new File([blob], `${base}.${ext}`, { type: blob.type })
}
