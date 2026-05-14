import Link from "next/link"
import { CalendarCheck2, ClipboardCheck, FileSearch, Handshake, MapPinned, ShieldCheck, TrendingUp } from "lucide-react"
import { localMarketMatrix } from "@/lib/complexity"
import { documentChecklist } from "@/lib/experience"

const reviewTracks = [
  {
    icon: FileSearch,
    title: "Dosar juridic",
    scope: "Acte, cadastru, fiscalitate",
    proof: "observatii clare inainte de oferta",
  },
  {
    icon: MapPinned,
    title: "Context de zona",
    scope: "Pret/mp, cerere, acces si servicii",
    proof: "comparatie cu piata locala",
  },
  {
    icon: CalendarCheck2,
    title: "Calendar realist",
    scope: "Vizionare, banca, notar si termene",
    proof: "pasii urmatori fara presiune",
  },
  {
    icon: Handshake,
    title: "Pozitie de negociere",
    scope: "Buget, risc si argumente",
    proof: "oferta sustinuta de date",
  },
]

const assuranceMetrics = [
  { value: "5", label: "puncte de documente", detail: "verificate inainte de decizie" },
  { value: "4", label: "zone analizate", detail: "cu lichiditate si randament" },
  { value: "48h", label: "fereastra oferta", detail: "pentru raspuns si clarificari" },
]

export default function TrustProofSection() {
  return (
    <section className="border-y border-bg-surface bg-bg-primary px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Verificare si incredere</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black text-text-primary md:text-4xl">
              Verificari HQS inainte de vizionare, oferta si avans.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              Fiecare recomandare trece printr-un filtru practic: documente, comparatie de piata, calendar de tranzactie si argumente de negociere.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {assuranceMetrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-bg-surface bg-bg-card p-4">
                <p className="text-2xl font-black text-accent">{metric.value}</p>
                <p className="mt-1 text-sm font-black text-text-primary">{metric.label}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {reviewTracks.map(({ icon: Icon, title, scope, proof }) => (
              <article key={title} className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-text-primary">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{scope}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
                <p className="mt-5 border-t border-bg-surface pt-4 text-sm font-black text-accent">{proof}</p>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-text-primary">Checklist de tranzactie</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Actele esentiale sunt legate de riscul real al proprietatii, nu bifate formal.
                </p>
              </div>
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent" aria-hidden />
            </div>

            <ul className="mt-5 divide-y divide-bg-surface">
              {documentChecklist.map((item) => (
                <li key={item} className="flex gap-3 py-3 text-sm leading-6 text-text-muted">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-bg-surface pt-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
                <p className="text-sm font-black text-text-primary">Semnale active de piata</p>
              </div>
              <div className="grid gap-2">
                {localMarketMatrix.slice(0, 3).map((zone) => (
                  <div key={zone.zone} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-bg-surface py-2 text-sm last:border-b-0">
                    <span className="font-bold text-text-primary">{zone.zone}</span>
                    <span className="text-text-muted">{zone.liquidity}/100</span>
                    <span className="font-black text-accent">{zone.rentYield}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/proprietati" className="inline-flex justify-center rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary transition hover:opacity-90">
                Vezi proprietatile verificate
              </Link>
              <Link href="/contact" className="inline-flex justify-center rounded-lg border border-bg-surface px-4 py-3 text-sm font-black text-text-primary transition hover:border-accent hover:text-accent">
                Cere analiza HQS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
