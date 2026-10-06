import Link from "next/link"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"

import { signOut } from "@/lib/actions/auth"
import { getSessionProfile, homeFor, isStaff } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function ArbitroLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) redirect("/login")
  // Staff can also open a sheet (from the fixture); delegates can't
  if (profile.role !== "referee" && !isStaff(profile)) redirect(homeFor(profile))

  return (
    <div className="min-h-screen bg-muted-bg">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={isStaff(profile) ? "/admin" : "/arbitro"} className="font-bold text-lg tracking-tight">
            Planilla de partido
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-white hover:bg-white/10 gap-1.5">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-3 py-5">{children}</main>
    </div>
  )
}
