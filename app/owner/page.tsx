import Header from "@/components/Header"
import Footer from "@/components/Footer"
import OwnerPortal from "@/components/OwnerPortal"

export const metadata = {
  title: "Portal proprietar | HQS Imobiliare",
  description: "Portal proprietar cu proprietati, rapoarte, documente si mandate filtrate pe emailul autentificat.",
  alternates: { canonical: "/owner" },
}

export default function OwnerPage() {
  return <main><Header /><OwnerPortal /><Footer /></main>
}
