import { PropertyWorkspace } from "@/components/fresh/Workflow"
import { SiteFooter, SiteHeader } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const revalidate = 60

export const metadata = {
  title: "Comparare proprietati | HQS Imobiliare",
  description: "Compara proprietatile selectate dupa pret, zona, suprafata si pret pe metru patrat.",
}

export default async function ComparePage() {
  const properties = await getPublishedProperties()
  return (
    <main id="continut">
      <SiteHeader />
      <PropertyWorkspace properties={properties} mode="compare" />
      <SiteFooter />
    </main>
  )
}
