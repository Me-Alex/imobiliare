import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPortalShell from "@/components/ClientPortalShell"
import { getPortalProperties } from "@/lib/portal-data"


export const metadata = {
  title: "Cont client | HQS Imobiliare",
  description: "Cont client cu login Supabase, profil, favorite, documente, oferte, programari si securitate cont.",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: true },
}

export default async function PortalPage() {
  const properties = await getPortalProperties()
  return <main id="continut"><Header /><ClientPortalShell properties={properties} /><Footer /></main>
}
