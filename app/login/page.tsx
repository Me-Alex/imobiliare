import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PortalLoginEntry from "@/components/PortalLoginEntry"

export const metadata = {
  title: "Cont client | HQS Imobiliare",
  description: "Autentificare client HQS Imobiliare cu email, parola si resetare parola.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
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
