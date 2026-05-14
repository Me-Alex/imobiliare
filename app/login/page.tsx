import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PortalLoginEntry from "@/components/PortalLoginEntry"

export const metadata = {
  title: "Cont client | HQS Imobiliare",
  description: "Autentificare client HQS Imobiliare cu email, parola, link de login si resetare parola.",
}

export default function LoginPage() {
  return (
    <main id="continut">
      <Header />
      <PortalLoginEntry />
      <Footer />
    </main>
  )
}
