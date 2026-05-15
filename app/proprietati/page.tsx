import { PropertyExplorer, RecommendationPanel } from "@/components/fresh/Workflow"
import { SiteFooter, SiteHeader } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const runtime = "edge"

export const revalidate = 60

export const metadata = {
  title: "Proprietati disponibile | HQS Imobiliare",
  description: "Cauta, filtreaza, salveaza si compara proprietatile HQS Imobiliare.",
}

type SearchParams = Record<string, string | string[] | undefined>

function valueOf(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function ProprietatiPage({ searchParams }: { searchParams?: SearchParams }) {
  const properties = await getPublishedProperties()
  const budget = Number(valueOf(searchParams, "budget") || "")

  return (
    <main id="continut">
      <SiteHeader />
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-5xl font-black tracking-normal md:text-7xl">Proprietati disponibile</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
            Filtrare rapida, favorite locale, comparare, scoruri de potrivire si legatura directa cu portalul client.
          </p>
        </div>
      </section>
      <PropertyExplorer
        properties={properties}
        initialQuery={valueOf(searchParams, "q") || ""}
        initialZone={valueOf(searchParams, "zone") || "Toate zonele"}
        initialType={valueOf(searchParams, "tip") || "toate"}
        initialBudget={Number.isFinite(budget) && budget > 0 ? budget : undefined}
      />
      <section className="bg-slate-100 px-4 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <RecommendationPanel properties={properties} />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
