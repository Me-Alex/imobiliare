import { PropertyWorkspace } from "@/components/fresh/Workflow"
import { SiteFooter, SiteHeader } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const revalidate = 60

export const metadata = {
  title: "Favorite | HQS Imobiliare",
  description: "Lista locala de proprietati favorite.",
}

export default async function FavoritePage() {
  const properties = await getPublishedProperties()
  return (
    <main id="continut">
      <SiteHeader />
      <PropertyWorkspace properties={properties} mode="favorites" />
      <SiteFooter />
    </main>
  )
}
