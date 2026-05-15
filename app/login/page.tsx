import { PortalExperience } from "@/components/fresh/Workflow"
import { SiteFooter, SiteHeader } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const revalidate = 60

export const metadata = {
  title: "Login client | HQS Imobiliare",
  description: "Autentificare si creare cont client HQS Imobiliare.",
}

export default async function LoginPage() {
  const properties = await getPublishedProperties()
  return (
    <main id="continut">
      <SiteHeader />
      <PortalExperience properties={properties} />
      <SiteFooter />
    </main>
  )
}
