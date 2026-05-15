import Link from "next/link"
import { ArrowRight, BarChart3, CalendarCheck2, FileSearch, KeyRound, MapPinned, ShieldCheck, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"
import type { Property } from "@/lib/supabase"
import { buildPortfolioAnalytics, localMarketMatrix } from "@/lib/complexity"
import { formatCurrency, formatInt } from "@/lib/format"

const advisoryTracks = [
  {
    icon: FileSearch,
    title: "Dosar verificat",
    text: "Acte, disponibilitate, cadastru si puncte de risc discutate inainte de vizionare.",
  },
  {
    icon: BarChart3,
    title: "Pret in context",
    text: "Comparatie cu pret/mp, lichiditate si alternative reale din aceeasi zona.",
  },
  {
    icon: CalendarCheck2,
    title: "Calendar de tranzactie",
    text: "Vizionare, oferta, banca si notar organizate cu pasi clari si termene realiste.",
  },
]

export default function HomeRedesignSections({ properties }: { properties: Property[] }) {
  const analytics = buildPortfolioAnalytics(properties.filter((property) => property.status === "PUBLISHED"))
  const zones = localMarketMatrix.slice(0, 4)

  return (
    <>
      <section className="border-y border-bg-surface bg-bg-secondary px-4 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">
              Informatii de piata care scurteaza cautarea.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted">
              Portofoliul HQS este construit pentru decizie, nu pentru volum. Urmarim preturi, viteza de vanzare, documente si semnale locale inainte sa recomandam o vizionare.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric title="Portofoliu live" value={formatInt(analytics.published)} detail="proprietati publicate" />
            <Metric title="Pret mediu/mp" value={formatCurrency(analytics.avgSqm)} detail="stoc activ" />
            <Metric title="Selectate HQS" value={formatInt(analytics.premium)} detail="cu verificare prioritara" />
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-7xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {zones.map((zone) => (
              <Link key={zone.zone} href={`/zone/${zone.zone.toLowerCase().replace(/\s+/g, "-")}`} className="group border border-bg-surface bg-bg-card p-5 shadow-card transition hover:border-accent">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Zona urmarita</p>
                    <h3 className="mt-2 text-xl font-black text-text-primary">{zone.zone}</h3>
                  </div>
                  <MapPinned className="h-5 w-5 text-accent" aria-hidden />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-bg-surface pt-4 text-sm">
                  <SmallMetric label="EUR/mp" value={formatInt(zone.avgPrice)} />
                  <SmallMetric label="Randament" value={`${zone.rentYield}%`} />
                  <SmallMetric label="Lichiditate" value={`${zone.liquidity}`} />
                </div>
              </Link>
            ))}
          </div>

          <div className="border border-bg-surface bg-bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Raport HQS</p>
                <h3 className="mt-2 text-2xl font-black text-text-primary">Semnale active pentru Bucuresti</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" aria-hidden />
            </div>
            <div className="mt-7 space-y-4">
              {[
                ["Cerere", "cumparatorii compara mai atent pret/mp si costurile de renovare"],
                ["Oferta", "stocul bun ramane scurt in zonele nord si centru"],
                ["Negociere", "argumentele solide vin din acte, lichiditate si alternative"],
              ].map(([label, text]) => (
                <div key={label} className="border-t border-bg-surface pt-4">
                  <p className="font-black text-text-primary">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{text}</p>
                </div>
              ))}
            </div>
            <Link href="/zone" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-black text-bg-primary transition hover:opacity-90">
              Vezi ghidurile locale
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">
              Un proces de consultanta construit in jurul deciziei.
            </h2>
            <p className="max-w-3xl text-base leading-8 text-text-muted">
              Fiecare discutie incepe cu criteriile tale si se inchide cu un pas verificabil: vizionare, oferta, evaluare sau amanare argumentata.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {advisoryTracks.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="border border-bg-surface bg-bg-card p-6 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-md border border-accent/20 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-black text-text-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-xl font-black text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-bg-surface bg-[#16211d] px-4 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md border border-white/12 bg-white/8 text-accent">
              <KeyRound className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-normal md:text-5xl">
              Clientii au un workspace pentru favorite, documente, oferte si programari.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/72">
              Portalul pastreaza istoricul cautarii si sincronizeaza preferintele cu echipa HQS, fara sa schimbe fluxul public al site-ului.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <PortalPoint icon={<ShieldCheck className="h-4 w-4" aria-hidden />} label="documente" value="verificare" />
            <PortalPoint icon={<CalendarCheck2 className="h-4 w-4" aria-hidden />} label="vizionari" value="calendar" />
            <PortalPoint icon={<MapPinned className="h-4 w-4" aria-hidden />} label="favorite" value="shortlist" />
            <Link href="/login" className="inline-flex min-h-24 items-center justify-center gap-2 rounded-md bg-accent px-5 py-4 text-sm font-black text-bg-primary transition hover:opacity-90">
              Cont client
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="border border-bg-surface bg-bg-card p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">{title}</p>
      <p className="mt-3 text-3xl font-black text-accent">{value}</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">{detail}</p>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 font-black text-text-primary">{value}</p>
    </div>
  )
}

function PortalPoint({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-md border border-white/12 bg-white/8 p-4">
      <div className="text-accent">{icon}</div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/52">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  )
}
