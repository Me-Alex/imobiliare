import ClientPortalShell from "@/components/ClientPortalShell"
import { getPortalProperties } from "@/lib/portal-data"

export const metadata = {
  title: "Cont client | HQS Imobiliare",
  description: "Cont client cu login Supabase, profil, favorite, documente, oferte, programari si securitate cont.",
  robots: { index: false, follow: true },
}

export default async function PortalPage() {
  const properties = await getPortalProperties()
  return <ClientPortalShell properties={properties} />
}
