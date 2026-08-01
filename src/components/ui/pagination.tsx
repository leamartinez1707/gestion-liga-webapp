"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  className?: string
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (targetPage <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(targetPage))
    }
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 pt-4", className)}>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg transition-colors"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  )
}
