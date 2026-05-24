import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPortalShell from "@/components/ClientPortalShell"
import { PUBLIC_PROPERTY_SELECT, supabase } from "@/lib/supabase"


export const metadata = {
  title: "Cont client | HQS Imobiliare",
  description: "Cont client cu login Supabase, profil, favorite, documente, oferte, programari si securitate cont.",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: true },
}

async function getPortalProperties() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(PUBLIC_PROPERTY_SELECT)
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal)

    if (error) return []
    return data || []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

export default async function PortalPage() {
  const properties = await getPortalProperties()
  return <main id="continut"><Header /><ClientPortalShell properties={properties} /><Footer /></main>
}
