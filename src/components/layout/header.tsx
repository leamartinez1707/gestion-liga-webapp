"use client"

import { useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, Lock } from "lucide-react"

import type { SeriesOption } from "@/components/series-selector"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SeriesSelector } from "@/components/series-selector"
import { navLinks } from "@/components/layout/nav-links"
import { cn } from "@/lib/utils"

function toDivSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

const seriesGradients = [
  "from-sky-500 to-sky-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-orange-500 to-orange-700",
  "from-pink-500 to-pink-700",
]

function getGradient(index: number): string {
  return seriesGradients[index % seriesGradients.length]
}

interface HeaderProps {
  seriesOptions: SeriesOption[]
}

export function Header({ seriesOptions }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  const handleSeriesChange = useCallback(
    (seriesSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("serie", seriesSlug)
      params.delete("div")
      router.push(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleDivisionChange = useCallback(
    (divSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("div", divSlug)
      router.push(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* Green gradient bar: logo + series selector + nav */}
      <div className="w-full bg-linear-to-b from-primary to-primary/95 text-primary-foreground">
        <div className="w-full px-4 md:px-6 py-4 md:py-5">
          {/* Top row: logo + nav */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-white/30 bg-linear-to-b from-white/10 to-transparent px-3 py-1 leading-none">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/70">LIGA</span>
                <span className="text-base font-black italic tracking-tight text-white">METROPOLITANA</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Admin link — desktop */}
            <Link
              href="/admin"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-primary-foreground/60 hover:text-white hover:bg-white/10 transition-colors ml-2"
              title="Panel de administración"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Panel</span>
            </Link>

            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger
                className="md:hidden"
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-white/10 shrink-0"
                    aria-label="Abrir menú"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-primary text-primary-foreground border-primary/20">
                <SheetTitle className="sr-only">Navegación</SheetTitle>

                {/* Series in mobile */}
                {seriesOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-6 pb-4 border-b border-white/10">
                    {seriesOptions.map((s, i) => (
                      <Link
                        key={s.id}
                        href={`/?serie=${s.slug}`}
                        className={cn(
                          "rounded-sm bg-linear-to-b px-2.5 py-1 text-xs font-bold uppercase text-white",
                          getGradient(i)
                        )}
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1 mt-4">
                  {navLinks.map((link) => {
                    const isActive =
                      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "px-3 py-2 rounded text-base font-medium transition-colors",
                          isActive
                            ? "bg-white/20 text-white"
                            : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                          )}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>

                {/* Admin link — mobile */}
                <div className="border-t border-white/10 mt-4 pt-4">
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded text-base font-medium text-primary-foreground/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    Panel de Administración
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Series selector */}
          {seriesOptions.length > 0 && (
            <SeriesSelector
              series={seriesOptions}
              selectedSeries={paramSerie}
              selectedDivision={paramDiv}
              onSeriesChange={handleSeriesChange}
              onDivisionChange={handleDivisionChange}
            />
          )}
        </div>
      </div>
    </header>
  )
}
