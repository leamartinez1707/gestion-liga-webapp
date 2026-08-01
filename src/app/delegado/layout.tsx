import Link from "next/link"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export default function DelegadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted-bg">
      {/* Simple header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/delegado" className="font-bold text-lg tracking-tight">
            Panel del Equipo
          </Link>
          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {children}
      </main>
    </div>
  )
}
