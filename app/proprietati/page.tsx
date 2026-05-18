import Footer from "@/components/Footer"
import Header from "@/components/Header"
import ProprietatiSection from "@/components/ProprietatiSection"
import Link from "next/link"
import { zoneProfiles } from "@/lib/experience"
import { listPropertyFacets, propertyFiltersFromSearchParams, searchPublishedProperties } from "@/lib/property-search"

export const runtime = "edge"

export const metadata = {
  title: "Proprietati disponibile | HQS Imobiliare",
  description: "Apartamente, case, vile si terenuri verificate de HQS Imobiliare.",
}

export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

export default async function ProprietatiPage({ searchParams }: { searchParams?: SearchParams }) {
  const filters = propertyFiltersFromSearchParams(searchParams)
  const [search, facets] = await Promise.all([
    searchPublishedProperties(filters),
    listPropertyFacets(),
  ])

  return (
    <main>
      <Header />
      <section className="border-b border-bg-surface bg-bg-secondary px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black tracking-normal text-text-primary md:text-6xl">Proprietati disponibile</h1>
          <p className="mt-5 max-w-2xl leading-8 text-text-muted">O lista scurta si verificata este mai utila decat zeci de anunturi neclare. Aici gasesti ofertele pe care le putem prezenta rapid, cu informatiile importante la zi.</p>
        </div>
      </section>
      <ProprietatiSection
        initialProperties={search.properties}
        initialTotal={search.total}
        initialHasMore={search.hasMore}
        initialPageSize={search.pageSize}
        initialQuery={filters.q}
        initialZone={filters.zone}
        initialType={filters.type}
        initialBudget={filters.maxPrice || undefined}
        initialRooms={filters.rooms}
        initialMinArea={filters.minArea}
        initialFeaturedOnly={filters.featuredOnly}
        initialSort={filters.sort}
        initialZones={facets.zones}
      />
      <section className="border-t border-bg-surface bg-bg-secondary px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><span className="text-xs font-bold uppercase tracking-widest text-accent">Analiza locala</span><h2 className="mt-2 text-3xl font-black text-text-primary">Zone cu profil diferit</h2></div>
            <Link href="/zone" className="text-sm font-bold text-accent">Vezi ghidurile</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {zoneProfiles.map((zone) => <Link key={zone.slug} href={`/zone/${zone.slug}`} className="rounded-lg border border-bg-surface bg-bg-card p-4 hover:border-accent"><p className="font-black text-text-primary">{zone.name}</p><p className="mt-1 text-sm text-text-muted">EUR {zone.avgPrice}/mp - {zone.demand}</p></Link>)}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
