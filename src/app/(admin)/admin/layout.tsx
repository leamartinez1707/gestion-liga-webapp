import { redirect } from "next/navigation"
import { Shield, LogOut } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import {
  AdminDesktopSidebar,
  AdminMobileSidebar,
} from "@/components/layout/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <AdminDesktopSidebar userEmail={user.email ?? undefined} />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top header (mobile menu + user info) */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-2 md:hidden">
            <AdminMobileSidebar userEmail={user.email ?? undefined} />
            <span className="text-sm font-semibold text-foreground">Admin</span>
          </div>

          {/* Desktop: user info */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              {user.email}
            </span>
          </div>

          {/* Sign out (mobile) */}
          <form action={signOut} className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
