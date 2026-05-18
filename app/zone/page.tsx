import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { zoneProfiles } from "@/lib/experience"

export const metadata = {
  title: "Zone imobiliare | HQS Imobiliare",
  description: "Ghiduri locale pentru cele mai cautate zone din portofoliul HQS Imobiliare.",
}

export default function ZonePage() {
  return (
    <main>
      <Header />
      <section className="border-b border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Ghid local</span>
          <h1 className="mt-3 text-4xl font-black text-text-primary">Zone analizate pentru decizii mai bune</h1>
          <p className="mt-4 max-w-2xl text-text-muted">Fiecare zona are ritmul ei: pret/mp, cerere, tip de client, lichiditate si riscuri. Aici grupam informatia intr-un format usor de comparat.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:grid-cols-2">
        {zoneProfiles.map((zone) => (
          <Link key={zone.slug} href={`/zone/${zone.slug}`} className="rounded-lg border border-bg-surface bg-bg-card p-6 transition-all hover:border-accent">
            <p className="text-sm font-bold text-accent">{zone.name}</p>
            <h2 className="mt-2 text-2xl font-black text-text-primary">{zone.headline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{zone.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg-secondary p-3"><p className="text-xs text-text-muted">Pret mediu</p><p className="font-black text-text-primary">EUR {zone.avgPrice}/mp</p></div>
              <div className="rounded-lg bg-bg-secondary p-3"><p className="text-xs text-text-muted">Cerere</p><p className="font-black text-text-primary">{zone.demand}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["apartamente", "vile", "case"].map((type) => <span key={type} className="rounded-full border border-bg-surface px-3 py-1 text-xs font-bold text-text-muted">/{type}</span>)}
            </div>
          </Link>
        ))}
      </section>
      <Footer />
    </main>
  )
}
