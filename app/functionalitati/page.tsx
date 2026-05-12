import FeatureCommandCenter from "@/components/FeatureCommandCenter"
import Footer from "@/components/Footer"
import Header from "@/components/Header"

export const metadata = {
  title: "100 functionalitati | HQS Imobiliare",
  description: "Roadmap interactiv cu 100 de functionalitati pentru platforma HQS Imobiliare.",
}

export default function FunctionalitatiPage() {
  return (
    <main>
      <Header />
      <FeatureCommandCenter />
      <Footer />
    </main>
  )
}
