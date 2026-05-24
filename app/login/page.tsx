import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PortalLoginEntry from "@/components/PortalLoginEntry"
import { Suspense } from "react"

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
      <Suspense
        fallback={
          <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
            <div className="mx-auto max-w-3xl rounded-lg border border-bg-surface bg-bg-card p-6 shadow-card">
              <h1 className="text-2xl font-black text-text-primary">Se incarca autentificarea...</h1>
              <p className="mt-2 text-sm leading-7 text-text-muted">Pregatim modulul de login.</p>
            </div>
          </section>
        }
      >
        <PortalLoginEntry />
      </Suspense>
      <Footer />
    </main>
  )
}
