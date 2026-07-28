import type { Metadata } from "next"
import "./globals.css"
import "@fontsource-variable/inter"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Liga Metropolitana de Futsal",
  description:
    "La liga de futsal más competitiva de la región. Resultados, fixtures, equipos y noticias del torneo.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
