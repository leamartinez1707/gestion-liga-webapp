"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface FilterSelect {
  /** URL param, e.g. "torneo" */
  param: string
  /** Option meaning "no filter", e.g. "Todos los torneos" */
  allLabel: string
  options: { value: string; label: string }[]
  /** Params that depend on this one and are cleared when it changes (e.g. division after series) */
  clears?: string[]
}

interface Props {
  /** Placeholder of the text search (param "q"); omit for no search box */
  searchPlaceholder?: string
  selects?: FilterSelect[]
  /** e.g. "34 equipos" */
  resultLabel?: string
}

const ALL = "__all"

/**
 * Admin list filters, kept in the URL (?q=…&torneo=…) so they combine with the
 * pagination and survive a reload. Changing a filter goes back to page 1.
 */
export function ListFilters({ searchPlaceholder, selects = [], resultLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete("page")
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Search as you type, without a request per key
  const onSearch = (value: string) => {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ q: value.trim() || null }), 350)
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const active = !!searchParams.get("q") || selects.some((s) => searchParams.get(s.param))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {searchPlaceholder && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} className="pl-8" aria-label="Buscar" />
          </div>
        )}
        {selects.map((s) => (
          <Select
            key={s.param}
            value={searchParams.get(s.param) ?? ALL}
            onValueChange={(v) =>
              update({ [s.param]: v && v !== ALL ? v : null, ...Object.fromEntries((s.clears ?? []).map((p) => [p, null])) })
            }
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-44" aria-label={s.allLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{s.allLabel}</SelectItem>
              {s.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setQ("")
              router.replace(pathname, { scroll: false })
            }}
          >
            <X className="size-4" />
            Limpiar
          </Button>
        )}
      </div>
      {resultLabel && <p className="text-xs text-muted-foreground">{resultLabel}</p>}
    </div>
  )
}
