import Contact from "@/components/Contact"
import Footer from "@/components/Footer"
import Header from "@/components/Header"

export const metadata = {
  title: "Contact | HQS Imobiliare",
  description: "Contactează echipa HQS Imobiliare pentru proprietăți, vizionări și recomandări.",
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
