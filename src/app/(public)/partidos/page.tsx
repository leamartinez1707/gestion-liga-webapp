import { getMatches } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { getSeries, getDivisions } from "@/lib/db/series"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

function toDivSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

interface Props { searchParams: Promise<{ serie?: string; div?: string; torneo?: string; fecha?: string }> }

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const serieSlug = params.serie ?? ""
  const divSlug = params.div ?? ""
  const torneoParam = params.torneo ?? ""
  const fechaParam = parseInt(params.fecha ?? "0")

  const [
    { data: matches, error },
    { data: teams },
    { data: seriesList },
    { data: divisionsList },
    { data: tournaments },
  ] = await Promise.all([getMatches(), getTeams(), getSeries(), getDivisions(), getTournaments()])

  if (error) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-destructive">{error}</p></div>

  const teamsList = teams ?? []
  const teamMap = new Map(teamsList.map((t) => [t.id, t]))
  const getShort = (id: string) => teamMap.get(id)?.shortName ?? "—"
  const getName = (id: string) => teamMap.get(id)?.name ?? "—"

  // Filter teams by series/division
  let filteredTeamIds: Set<string> = new Set(teamsList.map((t) => t.id))
  const series = (seriesList ?? []).find((s) => s.slug === serieSlug)
  if (series) {
    let st = teamsList.filter((t) => t.seriesId === series.id)
    if (divSlug) {
      const div = (divisionsList ?? []).find((d) => d.seriesId === series.id && toDivSlug(d.name) === divSlug)
      if (div) st = st.filter((t) => t.divisionId === div.id)
    }
    filteredTeamIds = new Set(st.map((t) => t.id))
  }

  // Filter matches by teams in the series
  let matchesList = (matches ?? []).filter((m) => filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId))

  // Filter tournaments: only those with teams in the current series
  const seriesTournaments = (tournaments ?? []).filter((t) => {
    const hasTeams = teamsList.some((team) => team.tournamentId === t.id && filteredTeamIds.has(team.id))
    return hasTeams
  })

  // Selected tournament (first by default)
  const selectedTorneo = torneoParam
    ? seriesTournaments.find((t) => t.id === torneoParam) ?? seriesTournaments[0]
    : seriesTournaments[0]

  // Filter matches by tournament
  if (selectedTorneo) {
    matchesList = matchesList.filter((m) => m.tournamentId === selectedTorneo.id)
  }

  // Group by matchday
  const matchdays = [...new Set(matchesList.map((m) => m.matchday))].sort((a, b) => a - b)
  const selectedFecha = fechaParam > 0 && matchdays.includes(fechaParam) ? fechaParam : matchdays[0] || 0

  const currentMatches = matchesList.filter((m) => m.matchday === selectedFecha)

  const currentSeriesName = series?.name ?? ""

  function buildUrl(params: Record<string, string>): string {
    const sp = new URLSearchParams()
    if (serieSlug) sp.set("serie", serieSlug)
    if (divSlug) sp.set("div", divSlug)
    for (const [k, v] of Object.entries(params)) sp.set(k, v)
    return `/partidos?${sp.toString()}`
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      {/* TITLE */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Fixture
          {currentSeriesName && <span className="text-primary"> · {currentSeriesName}</span>}
        </h1>
        {selectedTorneo && (
          <p className="mt-2 text-muted-foreground text-sm">{selectedTorneo.name} · {selectedTorneo.category}</p>
        )}
      </div>

      {/* TOURNAMENT SELECTOR */}
      {seriesTournaments.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {seriesTournaments.map((t) => (
            <a
              key={t.id}
              href={buildUrl({ torneo: t.id })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedTorneo?.id === t.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-muted-bg text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {t.name}
            </a>
          ))}
        </div>
      )}

      {/* MATCHDAY TABS */}
      {matchdays.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          {matchdays.map((md) => (
            <a
              key={md}
              href={buildUrl({ torneo: selectedTorneo?.id ?? "", fecha: String(md) })}
              className={`min-w-[44px] h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                selectedFecha === md
                  ? "bg-primary text-white shadow-sm scale-105"
                  : "bg-muted-bg text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {md}
            </a>
          ))}
        </div>
      )}

      {/* FIXTURE CARDS */}
      <div className="max-w-2xl mx-auto space-y-3">
        {currentMatches.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No hay partidos para esta fecha.</p>
        )}
        {currentMatches.map((m) => (
          <Card key={m.id} className="border-border overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                {/* HOME */}
                <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 bg-muted-bg/30">
                  <p className="font-bold text-sm text-center leading-tight">{getShort(m.homeTeamId)}</p>
                  {m.status === "finished" && (
                    <span className="text-2xl font-black tabular-nums text-foreground mt-1">{m.homeScore}</span>
                  )}
                </div>

                {/* CENTER */}
                <div className="flex flex-col items-center justify-center px-4 py-3 border-x border-border bg-background min-w-[80px]">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    VS
                  </span>
                  {m.status === "finished" ? (
                    <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success-soft">FINAL</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">PROG.</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground mt-1.5">{m.time} hs</span>
                </div>

                {/* AWAY */}
                <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 bg-muted-bg/30">
                  <p className="font-bold text-sm text-center leading-tight">{getShort(m.awayTeamId)}</p>
                  {m.status === "finished" && (
                    <span className="text-2xl font-black tabular-nums text-foreground mt-1">{m.awayScore}</span>
                  )}
                </div>
              </div>

              {/* Date footer */}
              <div className="text-center py-2 bg-muted-bg/50 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {formatDate(m.date)}
                  {m.venue && ` · ${m.venue}`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
