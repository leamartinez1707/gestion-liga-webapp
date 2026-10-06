import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const PLACEHOLDER = "/placeholder.svg"

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const significant = words.filter((w) => w.length > 2)
  return (significant.length ? significant : words)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

interface PhotoAvatarProps {
  /** Team shield or player photo URL; initials are shown when missing. */
  src?: string | null
  name: string
  className?: string
  fallbackClassName?: string
}

/** Shows the uploaded shield/photo (people want to see themselves) or initials. */
export function PhotoAvatar({ src, name, className, fallbackClassName }: PhotoAvatarProps) {
  const hasImage = !!src && src !== PLACEHOLDER
  return (
    <Avatar className={className}>
      {hasImage && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", fallbackClassName)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
