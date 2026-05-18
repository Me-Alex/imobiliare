import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ProprietateCard from "@/components/ProprietateCard"
import { buildSeoBlueprint } from "@/lib/complexity"
import { zoneProfiles } from "@/lib/experience"
import { loadMarketSignal } from "@/lib/market-data"
import { supabase } from "@/lib/supabase"

const typeMap: Record<string, { db: string; label: string }> = {
  apartamente: { db: "APARTMENT", label: "Apartamente" },
  case: { db: "HOUSE", label: "Case" },
  vile: { db: "VILLA", label: "Vile" },
  terenuri: { db: "LAND", label: "Terenuri" },
  comercial: { db: "COMMERCIAL", label: "Spatii comerciale" },
}

export function generateStaticParams() {
  return zoneProfiles.flatMap((zone) => Object.keys(typeMap).map((type) => ({ slug: zone.slug, type })))
}

export async function generateMetadata({ params }: { params: { slug: string; type: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  const type = typeMap[params.type]
  if (!zone || !type) return { title: "Pagina negasita" }
  const [market, cms] = await Promise.all([
    loadMarketSignal(zone.name),
    supabase.from("cms_entries").select("seo,content,title").eq("key", `zone.${params.slug}.${params.type}`).eq("status", "PUBLISHED").maybeSingle(),
  ])
  const blueprint = buildSeoBlueprint(zone.name, type.label)
  return {
    title: cms.data?.seo?.title || cms.data?.title || blueprint.title,
    description: cms.data?.seo?.description || `${blueprint.description} Pret mediu: EUR ${market.avgPrice}/mp, randament ${market.rentYield}%.`,
  }
}

export default async function ZoneTypePage({ params }: { params: { slug: string; type: string } }) {
  const zone = zoneProfiles.find((item) => item.slug === params.slug)
  const type = typeMap[params.type]
  if (!zone || !type) notFound()

  const [{ data: properties }, market, { data: cms }] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("type", type.db)
      .ilike("city", `%${zone.name.split(" ")[0]}%`)
      .limit(12),
    loadMarketSignal(zone.name),
    supabase.from("cms_entries").select("*").eq("key", `zone.${params.slug}.${params.type}`).eq("status", "PUBLISHED").maybeSingle(),
  ])
  const blueprint = buildSeoBlueprint(zone.name, type.label)
  const description = cms?.content?.body || blueprint.description
  const faq = Array.isArray(cms?.content?.faq) && cms.content.faq.length
    ? cms.content.faq
    : [
      { question: `Cat costa ${type.label.toLowerCase()} in ${zone.name}?`, answer: `Pretul mediu de referinta este EUR ${market.avgPrice}/mp, cu variatii in functie de pozitie, finisaje si documentatie.` },
      { question: `Este ${zone.name} potrivita pentru investitie?`, answer: `Randamentul estimat este ${market.rentYield}%, iar lichiditatea este ${market.liquidity}/100 conform datelor de piata din admin.` },
      { question: "Ce verificari recomanda HQS?", answer: "Comparam pret/mp, istoricul actelor, costurile recurente, vecinatatile si riscurile de revanzare inainte de oferta." },
    ]
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item: any) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <main>
      <Header />
      <section className="border-b border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <Link href={`/zone/${zone.slug}`} className="text-sm font-bold text-accent">Inapoi la {zone.name}</Link>
          <h1 className="mt-4 text-4xl font-black text-text-primary">{cms?.content?.headline || `${type.label} in ${zone.name}`}</h1>
          <p className="mt-4 max-w-3xl text-text-muted">{description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric label="Pret mediu zona" value={`EUR ${market.avgPrice}/mp`} />
            <Metric label="Randament chirie" value={`${market.rentYield}%`} />
            <Metric label="Lichiditate" value={`${market.liquidity}/100`} />
            <Metric label="Risc" value={market.risk} />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-bg-surface bg-bg-card p-6">
            <h2 className="font-black text-text-primary">Checklist local</h2>
            <div className="mt-4 space-y-3">
              {blueprint.sections.map((section) => <p key={section} className="rounded-lg border border-bg-surface bg-bg-secondary p-3 text-sm text-text-muted">{section}</p>)}
            </div>
            <Link href={`/proprietati?zone=${encodeURIComponent(zone.name)}&tip=${type.db}`} className="mt-5 inline-flex w-full justify-center rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">Filtreaza portofoliul</Link>
          </aside>
          <div>
            <h2 className="text-2xl font-black text-text-primary">Proprietati active</h2>
            <p className="mt-2 text-sm text-text-muted">Listari publicate din Supabase pentru combinatia zona + tip.</p>
            {properties && properties.length > 0 ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <ProprietateCard key={property.id} proprietate={property} />)}</div> : <div className="mt-5 rounded-lg border border-bg-surface bg-bg-card p-8 text-text-muted">Nu exista momentan listari publicate exact pe aceasta combinatie. Salveaza cautarea si primesti alerta cand apare una.</div>}
          </div>
        </div>
      </section>
      <section className="border-t border-bg-surface bg-bg-secondary px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-black text-text-primary">Intrebari frecvente</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faq.map((item: any) => <article key={item.question} className="rounded-lg border border-bg-surface bg-bg-card p-5"><h3 className="font-black text-text-primary">{item.question}</h3><p className="mt-3 text-sm leading-6 text-text-muted">{item.answer}</p></article>)}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Footer />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-black text-text-primary">{value}</p></div>
}
