import { getAlbums } from "@/lib/db/gallery"
import { getSeriesOptions } from "@/lib/db/series"
import { resolveScope } from "@/lib/scope"
import { AlbumCard } from "@/components/album-card"

interface Props { searchParams: Promise<{ serie?: string; div?: string }> }

export default async function GaleriaPage({ searchParams }: Props) {
  const params = await searchParams
  const [{ data: albums, error }, seriesOptions] = await Promise.all([getAlbums(), getSeriesOptions()])
  const { series } = resolveScope(seriesOptions, params.serie, params.div)

  // Albums of the selected series plus league-wide ones, with at least one photo
  const list = (albums ?? []).filter(
    (a) => a.photoCount > 0 && (!series || !a.seriesId || a.seriesId === series.id)
  )

  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Fotos{series && <span className="text-primary"> · {series.name}</span>}
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg">Buscate en las fotos de cada fecha.</p>

      {error && <p className="mt-12 text-center text-destructive text-sm">{error}</p>}

      {!error && list.length === 0 ? (
        <p className="mt-12 text-center py-12 text-muted-foreground">Todavía no hay fotos publicadas.</p>
      ) : (
        <div className="mt-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {list.map((a) => <AlbumCard key={a.id} album={a} />)}
        </div>
      )}
    </div>
  )
}
