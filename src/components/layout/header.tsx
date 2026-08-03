"use client"

import { useCallback, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, Lock } from "lucide-react"

import type { SeriesOption } from "@/components/series-selector"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SeriesSelector } from "@/components/series-selector"
import { navLinks } from "@/components/layout/nav-links"
import { cn } from "@/lib/utils"

interface HeaderProps {
  seriesOptions: SeriesOption[]
}

export function Header({ seriesOptions }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  useEffect(() => {
    if (!paramSerie && seriesOptions.length > 0 && pathname !== "/institucional") {
      const first = seriesOptions[0]
      const params = new URLSearchParams(searchParams.toString())
      params.set("serie", first.slug)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [paramSerie, seriesOptions, pathname, router, searchParams])

  const handleSeriesChange = useCallback(
    (seriesSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("serie", seriesSlug)
      params.delete("div")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, pathname]
  )

  const handleDivisionChange = useCallback(
    (divSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("div", divSlug)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, pathname]
  )

  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Navy bar */}
      <div className="w-full bg-primary shadow-sm">
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-white font-extrabold text-sm tracking-tight">
              LIGA METROPOLITANA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? isHome : pathname.startsWith(link.href)
              const navHref = paramSerie
                ? `${link.href}?serie=${paramSerie}${paramDiv ? `&div=${paramDiv}` : ""}`
                : link.href
              return (
                <Link
                  key={link.href}
                  href={navHref}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/admin"
              className="ml-2 px-2 py-1 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
              title="Panel de administración"
            >
              <Lock className="h-3.5 w-3.5" />
            </Link>
          </nav>

          <Sheet>
            <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0" aria-label="Abrir menú" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary text-white border-white/10">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => {
                  const isActive = link.href === "/" ? isHome : pathname.startsWith(link.href)
                  const navHref = paramSerie
                    ? `${link.href}?serie=${paramSerie}${paramDiv ? `&div=${paramDiv}` : ""}`
                    : link.href
                  return (
                    <Link key={link.href} href={navHref} className={cn("px-3 py-2 rounded text-base font-medium", isActive ? "bg-white/20" : "text-white/70 hover:bg-white/10")}>
                      {link.label}
                    </Link>
                  )
                })}
                <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded text-base text-white/40 hover:text-white mt-2">
                  <Lock className="h-4 w-4" /> Panel
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Series selector bar */}
      {seriesOptions.length > 0 && (
        <div className="w-full bg-white border-b border-border/50 shadow-[0_1px_3px_rgba(26,43,72,0.04)]">
          <div className="px-4 py-2">
            <SeriesSelector
              series={seriesOptions}
              selectedSeries={paramSerie}
              selectedDivision={paramDiv}
              onSeriesChange={handleSeriesChange}
              onDivisionChange={handleDivisionChange}
            />
          </div>
        </div>
      )}
    </header>
  )
}
