"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react"

import type { Photo } from "@/lib/types"

/** Grid of photos with a full-screen viewer (arrows, swipe, Esc, download). */
export function PhotoViewer({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const close = useCallback(() => setIndex(null), [])
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)), [photos.length])
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % photos.length)), [photos.length])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [index, close, prev, next])

  const current = index === null ? null : photos[index]

  return (
    <>
      <ul className="grid gap-1.5 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="relative block aspect-square w-full overflow-hidden rounded-md bg-muted-bg focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`Ver foto ${i + 1} de ${photos.length}`}
            >
              <Image
                src={photo.thumbUrl ?? photo.url}
                alt={photo.caption ?? `${title} — foto ${i + 1}`}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                className="object-cover transition-transform hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${index + 1} de ${photos.length}`}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return
            const dx = e.changedTouches[0].clientX - touchStart
            if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
            setTouchStart(null)
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm tabular-nums">{index + 1} / {photos.length}</span>
            <div className="flex items-center gap-1">
              <a
                href={current.url}
                download
                target="_blank"
                rel="noopener"
                className="rounded p-2 hover:bg-white/10"
                aria-label="Descargar foto"
              >
                <Download className="h-5 w-5" />
              </a>
              <button type="button" onClick={close} className="rounded p-2 hover:bg-white/10" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <Image
              key={current.id}
              src={current.url}
              alt={current.caption ?? `${title} — foto ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Foto anterior">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Foto siguiente">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {current.caption && <p className="p-3 text-center text-sm text-white/80">{current.caption}</p>}
        </div>
      )}
    </>
  )
}
