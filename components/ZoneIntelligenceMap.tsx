type Poi = { id: string; zone: string; name: string; category: string; minutes: number; score: number; lat?: number | null; lng?: number | null; notes?: string | null }

const categoryColors: Record<string, string> = {
  transport: "bg-sky-500",
  educatie: "bg-amber-500",
  business: "bg-indigo-500",
  lifestyle: "bg-emerald-500",
  general: "bg-accent",
}

export default function ZoneIntelligenceMap({ zone, pois }: { zone: string; pois: Poi[] }) {
  const items = pois.length ? pois : [
    { id: "default-1", zone, name: "Transport", category: "transport", minutes: 10, score: 82 },
    { id: "default-2", zone, name: "Servicii", category: "lifestyle", minutes: 8, score: 78 },
  ]
  const avg = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)
  const fastest = [...items].sort((a, b) => a.minutes - b.minutes)[0]
  const strongest = [...items].sort((a, b) => b.score - a.score)[0]

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-text-primary">Harta inteligenta {zone}</h2>
            <p className="text-sm text-text-muted">Puncte de interes, scor local si timp estimat pana la servicii importante.</p>
          </div>
          <div className="rounded-lg bg-bg-secondary px-4 py-3 text-right">
            <p className="text-xs text-text-muted">Scor zona</p>
            <p className="text-2xl font-black text-accent">{avg}/100</p>
          </div>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <Signal title="Cel mai rapid acces" value={`${fastest?.name || "Servicii"} · ${fastest?.minutes || 0} min`} />
          <Signal title="Cel mai bun scor" value={`${strongest?.name || "Zona"} · ${strongest?.score || avg}/100`} />
          <Signal title="Acoperire POI" value={`${items.length} puncte analizate`} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-bg-surface bg-bg-secondary">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.25) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
            <div className="absolute left-[12%] right-[12%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-bg-surface" />
            <div className="absolute bottom-[16%] left-1/2 top-[16%] w-1 -translate-x-1/2 rounded-full bg-bg-surface" />
            <div className="absolute left-[45%] top-[44%] rounded-lg border border-accent/40 bg-accent px-4 py-3 text-center text-xs font-black text-bg-primary shadow-sm">Centru {zone}</div>
            {items.map((poi, index) => (
              <div
                key={poi.id}
                className="absolute max-w-[150px] rounded-lg border border-bg-surface bg-bg-card px-3 py-2 text-xs shadow-sm"
                style={{ left: `${positionFromPoi(poi, index, "x")}%`, top: `${positionFromPoi(poi, index, "y")}%` }}
              >
                <span className={`mb-2 block h-2 w-8 rounded-full ${categoryColors[poi.category] || categoryColors.general}`} />
                <b className="text-text-primary">{poi.name}</b>
                <p className="text-text-muted">{poi.minutes} min</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            {items.map((poi) => (
              <div key={poi.id} className="rounded-lg border border-bg-surface bg-bg-secondary p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-text-primary">{poi.name}</p>
                    <p className="text-sm text-text-muted">{poi.category} - {poi.minutes} minute</p>
                    {poi.notes && <p className="mt-1 text-xs text-text-muted">{poi.notes}</p>}
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">{poi.score}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-bg-surface">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${poi.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function positionFromPoi(poi: Poi, index: number, axis: "x" | "y") {
  if (typeof poi.lat === "number" && typeof poi.lng === "number") {
    const normalized = axis === "x" ? ((poi.lng + 180) % 1) * 100 : ((poi.lat + 90) % 1) * 100
    return Math.max(8, Math.min(78, Math.round(normalized)))
  }
  return axis === "x" ? 12 + (index * 21) % 70 : 12 + (index * 27) % 68
}

function Signal({ title, value }: { title: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="text-xs font-bold uppercase text-text-muted">{title}</p><p className="mt-2 font-black text-text-primary">{value}</p></div>
}
