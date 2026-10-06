import Link from "next/link"
import { Images } from "lucide-react"

import type { PhotoAlbum } from "@/lib/types"
import { CoverImage } from "@/components/cover-image"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

export function AlbumCard({ album, sizes = "(min-width: 1024px) 25vw, 50vw" }: { album: PhotoAlbum; sizes?: string }) {
  return (
    <Link href={`/galeria/${album.id}`} className="group block rounded-lg border border-border overflow-hidden bg-background hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3]">
        <CoverImage src={album.coverUrl} alt={album.title} sizes={sizes} />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
          <Images className="h-3 w-3" />
          {album.photoCount}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug group-hover:text-primary line-clamp-2">{album.title}</p>
        {album.date && <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(album.date)}</p>}
      </div>
    </Link>
  )
}
