import { FileText, MapPin, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InstitucionalPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Institucional</h1>
      <p className="text-muted-foreground mb-10">
        Información institucional de la Liga Metropolitana de Futsal.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* League history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Historia de la Liga
            </CardTitle>
            <CardDescription>Nuestra trayectoria</CardDescription>
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
            <p>
              La temporada 2026 marca un hito importante con la digitalización de todos los
              procesos de la liga, incluyendo este sitio web que permite a jugadores, clubes y
              aficionados seguir toda la acción en tiempo real.
            </p>
          </CardContent>
        </Card>

        {/* Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Documentación
            </CardTitle>
            <CardDescription>Descargables oficiales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" render={<a href="#" download />}>
              <FileText className="mr-2 h-4 w-4" />
              Reglamento General (PDF)
            </Button>
            <Button variant="outline" className="w-full justify-start" render={<a href="#" download />}>
              <FileText className="mr-2 h-4 w-4" />
              Calendario 2026 (PDF)
            </Button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación
            </CardTitle>
            <CardDescription>Dónde encontrarnos</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Av. del Deporte 1234</p>
            <p>Ciudad Deportiva</p>
            <p>CP 5000, Córdoba</p>
            <p className="mt-3">
              <strong>Email:</strong> info@ligametropolitana.com
            </p>
            <p>
              <strong>Tel:</strong> +54 351 456-7890
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-5 w-5 text-primary" />
              Preguntas Frecuentes
            </CardTitle>
            <CardDescription>FAQ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-1">¿Cómo puedo inscribir un equipo?</h3>
              <p className="text-sm text-muted-foreground">
                La inscripción de equipos se realiza al inicio de cada temporada. Comunicate con
                la liga a través del formulario de contacto o enviando un email a
                inscripciones@ligametropolitana.com.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">¿Cuándo comienza la temporada?</h3>
              <p className="text-sm text-muted-foreground">
                La temporada 2026 comienza el 15 de agosto. El calendario completo está disponible
                en nuestra sección de Partidos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">¿Dónde se juegan los partidos?</h3>
              <p className="text-sm text-muted-foreground">
                Los partidos se disputan en el Estadio Cubierto Municipal y en las sedes de cada
                club. Consultá el fixture para conocer la ubicación de cada encuentro.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">¿Cómo puedo comunicarme con la liga?</h3>
              <p className="text-sm text-muted-foreground">
                Podés escribirnos a info@ligametropolitana.com o llamarnos al +54 351 456-7890 en
                horario administrativo de lunes a viernes de 9 a 18 hs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
