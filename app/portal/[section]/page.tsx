import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPortalShell from "@/components/ClientPortalShell"
import { getPortalProperties } from "@/lib/portal-data"
import { metadata } from "../page"

export { metadata }

const allowedSections = new Set(["profile", "profil", "favorite", "favorites", "recommendations", "recomandari", "documents", "documente", "offers", "oferte", "activity", "activitate", "security", "securitate"])

export default async function PortalSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const properties = await getPortalProperties()
  const safeSection = allowedSections.has(String(section || "").toLowerCase()) ? section : "profil"

  return (
    <main id="continut">
      <Header />
      <ClientPortalShell properties={properties} initialSection={safeSection} />
      <Footer />
    </main>
  )
}
