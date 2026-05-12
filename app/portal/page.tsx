import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPropertyWorkspace from "@/components/ClientPropertyWorkspace"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"

export const metadata = {
  title: "Portal client | HQS Imobiliare",
  description: "Spatiu client pentru favorite, comparatii, buget, documente si urmatorii pasi.",
}

export default async function PortalPage() {
  const { data } = await supabase.from("properties").select("*").eq("status", "PUBLISHED").order("created_at", { ascending: false })
  return <main><Header /><ClientPropertyWorkspace properties={data || []} mode="portal" /><Footer /></main>
}
