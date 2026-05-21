import Contact from "@/components/Contact"
import Footer from "@/components/Footer"
import Header from "@/components/Header"

export const metadata = {
  title: "Contact | HQS Imobiliare",
  description: "Contacteaza echipa HQS Imobiliare pentru proprietati, vizionari si recomandari.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | HQS Imobiliare",
    description: "Contacteaza echipa HQS Imobiliare pentru proprietati, vizionari si recomandari.",
    url: "/contact",
  },
}

export default function ContactPage() {
  return (
    <main>
      <Header />
      <Contact />
      <Footer />
    </main>
  )
}
