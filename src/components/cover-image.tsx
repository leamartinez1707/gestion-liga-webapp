import Image from "next/image"
import { cn } from "@/lib/utils"

const PLACEHOLDER = "/placeholder.svg"

interface CoverImageProps {
  src?: string | null
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

/**
 * Fills its (relative) parent with the uploaded image, or a brand-colored
 * block when there's none. Parent must set the aspect ratio.
 */
export function CoverImage({ src, alt, sizes, className, priority }: CoverImageProps) {
  if (!src || src === PLACEHOLDER) {
    return <div className={cn("absolute inset-0 bg-primary-light", className)} aria-hidden />
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  )
}
