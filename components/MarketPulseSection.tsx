import Link from "next/link"
import type { Property } from "@/lib/supabase"
import { estimateMonthlyPayment, zoneProfiles } from "@/lib/experience"
import { buildPortfolioAnalytics, getMarketSignal } from "@/lib/complexity"

type ZoneRow = {
  city: string
  count: number
  avgSqm: number
  minPrice: number
  maxPrice: number
  featured: number
}

const money = new Intl.NumberFormat("ro-RO")

export default function MarketPulseSection({ properties }: { properties: Property[] }) {
  const published = properties.filter((property) => property.status === "PUBLISHED")
  const analytics = buildPortfolioAnalytics(published)
  const zoneRows = buildZoneRows(published)
  const bestValue = published.filter((p) => p.area_sqm > 0).sort((a, b) => pricePerSqm(a) - pricePerSqm(b))[0]
  const familyPick = published
    .filter((p) => p.rooms >= 3 && p.parking_spots > 0)
    .sort((a, b) => a.price - b.price)[0]
  const premiumPick = published.find((p) => p.featured) || published[0]

  if (!published.length) {
    return (
      <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Market pulse</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black text-text-primary">Analiza se activeaza cand portofoliul live este incarcat.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            Sectiunea foloseste proprietatile publicate din Supabase pentru pret/mp, zone active, selectie premium si recomandari de actiune.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Market pulse</p>
            <h2 className="mt-3 text-3xl font-black text-text-primary md:text-4xl">Date rapide pentru o decizie imobiliara mai buna</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              Un sumar calculat din portofoliul publicat: valoare, pret/mp, zone cu stoc, selectie pentru familie si oportunitati de negociere.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Portofoliu live" value={String(analytics.published)} detail="proprietati publicate" />
            <Metric label="Valoare listata" value={`EUR ${money.format(analytics.totalValue)}`} detail="total portofoliu" />
            <Metric label="Pret mediu/mp" value={`EUR ${money.format(analytics.avgSqm)}`} detail="calcul pe stoc activ" />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-text-primary">Zone active</h3>
                <p className="text-sm text-text-muted">Preturi, lichiditate si context pentru zonele unde exista proprietati live.</p>
              </div>
              <Link href="/zone" className="text-sm font-black text-accent">Vezi ghidurile de zone</Link>
            </div>
            <div className="grid gap-3">
              {zoneRows.map((row) => {
                const market = getMarketSignal(row.city)
                const zoneHref = zoneUrl(row.city)
                const relation = row.avgSqm > market.avgPrice * 1.08 ? "peste media zonei" : row.avgSqm < market.avgPrice * 0.94 ? "sub media zonei" : "aliniat cu piata"
                return (
                  <Link key={row.city} href={zoneHref} className="grid gap-4 rounded-lg border border-bg-surface bg-bg-secondary p-4 transition-colors hover:border-accent md:grid-cols-[1fr_150px_150px_140px]">
                    <div>
                      <p className="font-black text-text-primary">{row.city}</p>
                      <p className="mt-1 text-sm text-text-muted">{row.count} proprietati, {row.featured} selectate de echipa</p>
                    </div>
                    <DataPoint label="Pret/mp" value={`EUR ${money.format(row.avgSqm)}`} />
                    <DataPoint label="Lichiditate" value={`${market.liquidity}/100`} />
                    <div>
                      <p className="text-xs uppercase text-text-muted">Semnal</p>
                      <p className="mt-1 text-sm font-black text-accent">{relation}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <OpportunityCard
              label="Oportunitate pret/mp"
              property={bestValue}
              detail={bestValue ? `EUR ${money.format(Math.round(pricePerSqm(bestValue)))} / mp` : "indisponibil"}
            />
            <OpportunityCard
              label="Alegere pentru familie"
              property={familyPick || premiumPick}
              detail={(familyPick || premiumPick) ? `${(familyPick || premiumPick).rooms || "-"} camere, ${(familyPick || premiumPick).parking_spots || 0} parcari` : "indisponibil"}
            />
            <OpportunityCard
              label="Selectie premium"
              property={premiumPick}
              detail={premiumPick ? `Rata orientativa EUR ${money.format(estimateMonthlyPayment(premiumPick.price))}/luna` : "indisponibil"}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-accent">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  )
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-text-muted">{label}</p>
      <p className="mt-1 font-black text-text-primary">{value}</p>
    </div>
  )
}

function OpportunityCard({ label, property, detail }: { label: string; property?: Property; detail: string }) {
  if (!property) {
    return (
      <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="mt-3 text-sm text-text-muted">Nu exista inca suficiente date pentru acest semnal.</p>
      </div>
    )
  }

  return (
    <Link href={`/proprietate/${property.slug}`} className="rounded-lg border border-bg-surface bg-bg-card p-5 transition-colors hover:border-accent">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <h3 className="mt-2 font-black text-text-primary">{property.title}</h3>
      <p className="mt-1 text-sm text-text-muted">{property.city} - EUR {money.format(property.price)}</p>
      <p className="mt-3 text-sm font-black text-accent">{detail}</p>
    </Link>
  )
}

function buildZoneRows(properties: Property[]) {
  const map = new Map<string, Property[]>()
  for (const property of properties) {
    const key = property.city || "Necunoscut"
    map.set(key, [...(map.get(key) || []), property])
  }

  return Array.from(map.entries())
    .map(([city, rows]): ZoneRow => ({
      city,
      count: rows.length,
      avgSqm: Math.round(rows.reduce((sum, property) => sum + pricePerSqm(property), 0) / rows.length),
      minPrice: Math.min(...rows.map((property) => property.price)),
      maxPrice: Math.max(...rows.map((property) => property.price)),
      featured: rows.filter((property) => property.featured).length,
    }))
    .sort((a, b) => b.count - a.count || a.avgSqm - b.avgSqm)
    .slice(0, 5)
}

function pricePerSqm(property: Property) {
  return property.area_sqm > 0 ? property.price / property.area_sqm : property.price
}

function zoneUrl(city: string) {
  const normalized = city.toLowerCase()
  const zone = zoneProfiles.find((item) => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized))
  return zone ? `/zone/${zone.slug}` : `/proprietati?zona=${encodeURIComponent(city)}`
}
