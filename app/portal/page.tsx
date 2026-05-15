import { PortalExperience, PropertyWorkspace, RecommendationPanel } from "@/components/fresh/Workflow"
import { SiteFooter, SiteHeader } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const revalidate = 60

export const metadata = {
  title: "Portal client | HQS Imobiliare",
  description: "Portal client cu autentificare Supabase, profil, favorite si recomandari.",
}

export default async function PortalPage() {
  const properties = await getPublishedProperties()
  return (
    <main id="continut">
      <SiteHeader />
      <PortalExperience properties={properties} />
      <PropertyWorkspace properties={properties} mode="portal" />
      <section className="bg-slate-100 px-4 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <RecommendationPanel properties={properties} />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
