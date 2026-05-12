type Poi = { id: string; zone: string; name: string; category: string; minutes: number; score: number }

export default function ZoneIntelligenceMap({ zone, pois }: { zone: string; pois: Poi[] }) {
  const items = pois.length ? pois : [
    { id: "default-1", zone, name: "Transport", category: "transport", minutes: 10, score: 82 },
    { id: "default-2", zone, name: "Servicii", category: "lifestyle", minutes: 8, score: 78 },
  ]
  const avg = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)

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
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-bg-surface bg-bg-secondary">
            <div className="absolute inset-6 rounded-lg border border-dashed border-bg-surface" />
            <div className="absolute left-[18%] top-[24%] h-16 w-16 rounded-lg bg-accent/20 p-2 text-center text-xs font-black text-accent">Centru</div>
            {items.map((poi, index) => (
              <div
                key={poi.id}
                className="absolute rounded-lg border border-accent/30 bg-bg-card px-3 py-2 text-xs shadow-sm"
                style={{ left: `${18 + (index * 19) % 62}%`, top: `${18 + (index * 23) % 58}%` }}
              >
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
