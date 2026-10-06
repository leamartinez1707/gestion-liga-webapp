"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Re-fetches the page every `seconds` while a match is being played. */
export function AutoRefresh({ active, seconds = 30 }: { active: boolean; seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [active, seconds, router])
  return null
}
