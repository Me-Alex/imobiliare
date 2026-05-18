import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPropertyWorkspace from "@/components/ClientPropertyWorkspace"
import { supabase } from "@/lib/supabase"


export const metadata = {
  title: "Comparare proprietati | HQS Imobiliare",
  description: "Compara proprietatile salvate dupa pret, suprafata, rata estimata si potrivire.",
}

export default async function CompararePage() {
  const { data } = await supabase.from("properties").select("*").eq("status", "PUBLISHED")
  return <main><Header /><ClientPropertyWorkspace properties={data || []} mode="compare" /><Footer /></main>
}
