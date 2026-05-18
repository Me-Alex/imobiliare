import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ProprietateCard from "@/components/ProprietateCard"
import ZoneIntelligenceMap from "@/components/ZoneIntelligenceMap"
import { zoneProfiles } from "@/lib/experience"
import { siteConfig } from "@/lib/site-config"
import { supabase } from "@/lib/supabase"


export function generateStaticParams() {
  return zoneProfiles.map((zone) => ({ slug: zone.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  if (!zone) return { title: "Zona negasita" }
  const { data: cms } = await supabase.from("cms_entries").select("*").eq("key", `zone.${params.slug}`).eq("status", "PUBLISHED").maybeSingle()
  return {
    title: cms?.seo?.title || `${zone.name} | Ghid imobiliar HQS`,
    description: cms?.seo?.description || cms?.content?.body || zone.description,
  }
}

export default async function ZoneDetailPage({ params }: { params: { slug: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  if (!zone) notFound()

  const { data } = await supabase
    .from("properties")
    .select("id,slug,title,city,county,address,price,area_sqm,rooms,bathrooms,cover_image_url,featured,type,status,currency,parking_spots,published_at,created_at,description,gallery_urls")
    .eq("status", "PUBLISHED")
    .ilike("city", `%${zone.name.split(" ")[0]}%`)
    .limit(6)
  const { data: pois } = await supabase.from("zone_poi").select("*").ilike("zone", `%${zone.name.split(" ")[0]}%`).order("score", { ascending: false })
  const { data: cms } = await supabase.from("cms_entries").select("*").eq("key", `zone.${params.slug}`).eq("status", "PUBLISHED").maybeSingle()
  const headline = cms?.content?.headline || zone.headline
  const description = cms?.content?.body || zone.description

  const siteBase = siteConfig.url.replace(/\/$/, "")
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "HQS Imobiliare", item: siteBase },
      { "@type": "ListItem", position: 2, name: "Zone", item: `${siteBase}/zone` },
      { "@type": "ListItem", position: 3, name: zone.name, item: `${siteBase}/zone/${zone.slug}` },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <Header />
      <section className="border-b border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-accent transition-colors">Acasa</Link>
            <span aria-hidden>/</span>
            <Link href="/zone" className="hover:text-accent transition-colors">Zone</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-text-primary">{zone.name}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-black text-text-primary">{zone.name}</h1>
          <p className="mt-4 max-w-3xl text-text-muted">{description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric label="Pret mediu" value={`EUR ${zone.avgPrice}/mp`} />
            <Metric label="Cerere" value={zone.demand} />
            <Metric label="Profil" value={headline} />
            <Metric label="Strategie" value="vizionare + comparatie" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-bg-surface bg-bg-card p-6">
            <h2 className="font-black text-text-primary">Puncte forte</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {zone.strengths.map((item) => <span key={item} className="rounded-full border border-bg-surface px-3 py-1 text-sm text-text-muted">{item}</span>)}
            </div>
            <div className="mt-6 rounded-lg bg-bg-secondary p-4">
              <p className="text-xs uppercase text-text-muted">Recomandare HQS</p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">Compara minim trei proprietati similare, verifica pretul/mp si cere documentele inainte de oferta.</p>
            </div>
          </aside>
          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-text-primary">Proprietati relevante</h2>
                <p className="text-sm text-text-muted">Filtrate dupa oras/zona din baza live.</p>
              </div>
              <Link href="/proprietati" className="text-sm font-bold text-accent">Vezi tot</Link>
            </div>
            {data && data.length > 0 ? <div className="grid gap-5 md:grid-cols-2">{data.map((p) => <ProprietateCard key={p.id} proprietate={p} />)}</div> : <div className="rounded-lg border border-bg-surface bg-bg-card p-8 text-text-muted">Nu exista proprietati publicate direct in aceasta zona, dar putem cauta oferte similare.</div>}
          </div>
        </div>
      </section>
      <ZoneIntelligenceMap zone={zone.name} pois={pois || []} />
      <Footer />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-black text-text-primary">{value}</p></div>
}
