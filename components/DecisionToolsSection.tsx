import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, MapPinned, ShieldCheck } from "lucide-react"
import type { Property } from "@/lib/supabase"
import { buildPortfolioAnalytics, localMarketMatrix } from "@/lib/complexity"
import { scoreProperty, type BuyerProfile } from "@/lib/experience"

const money = new Intl.NumberFormat("ro-RO")

const defaultProfile: BuyerProfile = {
  budget: 250000,
  area: "orice",
  rooms: 3,
  purpose: "locuire",
}

const workflow = [
  {
    title: "Shortlist curat",
    text: "Alegem putine proprietati, cu motive clare pentru fiecare recomandare.",
  },
  {
    title: "Verificare inainte de vizionare",
    text: "Comparam pret/mp, zona, acte si costuri probabile inainte sa pierzi timp.",
  },
  {
    title: "Oferta cu argumente",
    text: "Pregatim pozitia de negociere pe date, nu pe presiune sau presupuneri.",
  },
]

export default function DecisionToolsSection({ properties }: { properties: Property[] }) {
  const published = properties.filter((property) => property.status === "PUBLISHED")
  const analytics = buildPortfolioAnalytics(published)
  const recommended = published
    .map((property) => ({ property, ...scoreProperty(property, defaultProfile) }))
    .sort((a, b) => b.score - a.score)[0]
  const marketZones = localMarketMatrix.slice(0, 3)

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-text-primary md:text-5xl">
              Mai putine panouri, mai multa claritate pentru decizie.
            </h2>
            <p className="mt-5 text-base leading-8 text-text-muted">
              Am simplificat analiza intr-un rezumat practic: portofoliu, potrivire, piata si urmatorul pas. Restul detaliilor le discutam cand proprietatea merita vazuta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Portofoliu live" value={String(analytics.published)} detail="proprietati publicate" />
            <Metric label="Pret mediu/mp" value={`EUR ${money.format(analytics.avgSqm)}`} detail="stoc activ" />
            <Metric label="Selectate HQS" value={String(analytics.premium)} detail="verificate de echipa" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card">
            <div className="flex flex-col gap-4 border-b border-bg-surface pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">Recomandare rapida</p>
                <h3 className="mt-2 text-2xl font-black text-text-primary">
                  {recommended ? recommended.property.title : "Portofoliul se incarca"}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                  {recommended
                    ? `${recommended.property.city || "Bucuresti"} - EUR ${money.format(recommended.property.price)} - ${recommended.property.rooms || "-"} camere`
                    : "Cand exista proprietati publicate, aici apare prima recomandare calculata."}
                </p>
              </div>

              <div className="rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 text-left md:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Scor potrivire</p>
                <p className="mt-1 text-3xl font-black text-accent">{recommended ? recommended.score : "-"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="flex flex-wrap gap-2">
                {(recommended?.reasons.length ? recommended.reasons : ["buget si zona verificate", "pas urmator clar"]).slice(0, 3).map((reason) => (
                  <span key={reason} className="inline-flex items-center gap-2 rounded-full border border-bg-surface bg-bg-secondary px-3 py-1.5 text-xs font-bold text-text-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden />
                    {reason}
                  </span>
                ))}
              </div>

              {recommended ? (
                <Link
                  href={`/proprietate/${recommended.property.slug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary transition-transform hover:-translate-y-0.5"
                >
                  Vezi detalii
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <Link href="/proprietati" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary">
                  Vezi proprietati
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {workflow.map((item, index) => (
              <div key={item.title} className="grid grid-cols-[44px_1fr] gap-4 rounded-lg border border-bg-surface bg-bg-card p-4 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-bg-secondary text-sm font-black text-accent">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-black text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {marketZones.map((zone) => (
            <Link
              key={zone.zone}
              href={`/zone/${zone.zone.toLowerCase().replace(/\s+/g, "-")}`}
              className="group rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card transition-colors hover:border-accent/60"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Zona urmarita</p>
                  <h3 className="mt-2 text-lg font-black text-text-primary">{zone.zone}</h3>
                </div>
                <MapPinned className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-bg-surface pt-4">
                <SmallMetric icon={<BarChart3 className="h-4 w-4" aria-hidden />} label="EUR/mp" value={money.format(zone.avgPrice)} />
                <SmallMetric icon={<ClipboardCheck className="h-4 w-4" aria-hidden />} label="Chirie" value={`${zone.rentYield}%`} />
                <SmallMetric icon={<ShieldCheck className="h-4 w-4" aria-hidden />} label="Lichid." value={`${zone.liquidity}`} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/proprietati" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-black text-bg-primary transition hover:opacity-90">
            Deschide portofoliul
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-bg-surface px-5 py-3 text-sm font-black text-text-primary transition hover:border-accent hover:text-accent">
            Cere o recomandare
          </Link>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-accent">{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{detail}</p>
    </div>
  )
}

function SmallMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 text-accent">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-black text-text-primary">{value}</p>
    </div>
  )
}
