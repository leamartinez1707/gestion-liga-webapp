import { FileText, MapPin, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InstitucionalPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Institucional</h1>
      <p className="mt-3 text-muted-foreground max-w-lg">
        Información institucional de la Liga Metropolitana de Futsal.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* League history */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Historia de la Liga
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              La Liga Metropolitana de Futsal nació en 2010 con el objetivo de promover el futsal
              en la región y brindar un espacio de competencia organizada para los clubes locales.
              Desde entonces, ha crecido hasta convertirse en el torneo más importante de la zona,
              con más de 15 equipos participantes en dos categorías.
            </p>
            <p>
              A lo largo de estos años, la liga ha sido testigo de grandes partidos, jugadores
              talentosos y momentos inolvidables. Nuestra misión es seguir fomentando el deporte,
              la camaradería y el fair play entre todos los participantes.
            </p>
          </CardContent>
        </Card>

        {/* Downloads */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Documentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-sm" render={<a href="#" download />}>
              <FileText className="mr-2 h-4 w-4 shrink-0" />
              Reglamento General
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" render={<a href="#" download />}>
              <FileText className="mr-2 h-4 w-4 shrink-0" />
              Calendario 2026
            </Button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Av. del Deporte 1234</p>
            <p>Ciudad Deportiva</p>
            <p>CP 5000, Córdoba</p>
            <p className="pt-2"><strong>Email:</strong> info@ligametropolitana.com</p>
            <p><strong>Tel:</strong> +54 351 456-7890</p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-5 w-5 text-primary" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-1">¿Cómo puedo inscribir un equipo?</h3>
              <p className="text-sm text-muted-foreground">
                La inscripción se realiza al inicio de cada temporada. Escribí a inscripciones@ligametropolitana.com.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">¿Cuándo comienza la temporada?</h3>
              <p className="text-sm text-muted-foreground">
                La temporada 2026 comienza el 15 de agosto. El calendario completo está en la sección Partidos.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">¿Dónde se juegan los partidos?</h3>
              <p className="text-sm text-muted-foreground">
                En el Estadio Cubierto Municipal y sedes de cada club. Consultá el fixture para más detalles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
