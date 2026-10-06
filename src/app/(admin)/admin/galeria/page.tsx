import Link from "next/link"
import { Plus } from "lucide-react"

import { getAlbums } from "@/lib/db/gallery"
import { getSeries } from "@/lib/db/series"
import { createAlbumAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CoverImage } from "@/components/cover-image"
import { AlbumDialog } from "./album-dialog"
import { getMatchOptions } from "@/lib/db/match-options"

export default async function GaleriaAdminPage() {
  const [{ data: albums, error }, { data: series }, matches] = await Promise.all([
    getAlbums({ asStaff: true }),
    getSeries(),
    getMatchOptions(),
  ])

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>

  const seriesName = new Map((series ?? []).map((s) => [s.id, s.name]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Galería</h1>
          <p className="mt-1 text-sm text-muted-foreground">Álbumes de fotos de las fechas y eventos</p>
        </div>
        <AlbumDialog action={createAlbumAction} series={series ?? []} matches={matches}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo álbum</Button>
        </AlbumDialog>
      </div>

      {(albums ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Todavía no hay álbumes. Creá el primero.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {(albums ?? []).map((a) => (
            <Link key={a.id} href={`/admin/galeria/${a.id}`} className="group rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-[4/3]">
                <CoverImage src={a.coverUrl} alt={a.title} sizes="(min-width: 1024px) 25vw, 50vw" />
                {!a.published && (
                  <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">Borrador</Badge>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold truncate group-hover:text-primary">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.photoCount} {a.photoCount === 1 ? "foto" : "fotos"} · {a.seriesId ? seriesName.get(a.seriesId) : "Toda la liga"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
