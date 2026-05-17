import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ClientPropertyWorkspace from "@/components/ClientPropertyWorkspace"
import { supabase } from "@/lib/supabase"


export const metadata = {
  title: "Favorite | HQS Imobiliare",
  description: "Proprietatile salvate de tine intr-o lista scurta.",
}

export default async function FavoritePage() {
  const { data } = await supabase.from("properties").select("*").eq("status", "PUBLISHED")
  return <main><Header /><ClientPropertyWorkspace properties={data || []} mode="favorite" /><Footer /></main>
}
