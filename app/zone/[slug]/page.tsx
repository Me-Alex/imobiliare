import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ProprietateCard from "@/components/ProprietateCard"
import { zoneProfiles } from "@/lib/experience"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"

export function generateStaticParams() {
  return zoneProfiles.map((zone) => ({ slug: zone.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  if (!zone) return { title: "Zona negasita" }
  return { title: `${zone.name} | Ghid imobiliar HQS`, description: zone.description }
}

export default async function ZoneDetailPage({ params }: { params: { slug: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  if (!zone) notFound()
  const { data } = await supabase.from("properties").select("*").eq("status", "PUBLISHED").ilike("city", `%${zone.name.split(" ")[0]}%`).limit(6)
  return (
    <main>
      <Header />
      <section className="border-b border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <Link href="/zone" className="text-sm font-bold text-accent">Inapoi la zone</Link>
          <h1 className="mt-4 text-4xl font-black text-text-primary">{zone.name}</h1>
          <p className="mt-4 max-w-3xl text-text-muted">{zone.description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4"><Metric label="Pret mediu" value={`EUR ${zone.avgPrice}/mp`} /><Metric label="Cerere" value={zone.demand} /><Metric label="Profil" value={zone.headline} /><Metric label="Strategie" value="vizionare + comparatie" /></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-bg-surface bg-bg-card p-6"><h2 className="font-black text-text-primary">Puncte forte</h2><div className="mt-4 flex flex-wrap gap-2">{zone.strengths.map((item) => <span key={item} className="rounded-full border border-bg-surface px-3 py-1 text-sm text-text-muted">{item}</span>)}</div><div className="mt-6 rounded-lg bg-bg-secondary p-4"><p className="text-xs uppercase text-text-muted">Recomandare HQS</p><p className="mt-2 text-sm leading-relaxed text-text-muted">Compara minim trei proprietati similare, verifica pretul/mp si cere documentele inainte de oferta.</p></div></aside>
          <div><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-text-primary">Proprietati relevante</h2><p className="text-sm text-text-muted">Filtrate dupa oras/zona din baza live.</p></div><Link href="/proprietati" className="text-sm font-bold text-accent">Vezi tot</Link></div>{data && data.length > 0 ? <div className="grid gap-5 md:grid-cols-2">{data.map((p) => <ProprietateCard key={p.id} proprietate={p} />)}</div> : <div className="rounded-lg border border-bg-surface bg-bg-card p-8 text-text-muted">Nu exista proprietati publicate direct in aceasta zona, dar putem cauta oferte similare.</div>}</div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-black text-text-primary">{value}</p></div>
}
