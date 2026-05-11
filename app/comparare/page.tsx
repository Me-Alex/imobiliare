import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { Property } from "@/lib/supabase"

async function getData(): Promise<Property[]> {
  return []
}

export default async function CompararePage() {
  const items = await getData()

  return (
    <main>
      <Header />
      <section className="px-4 py-16 bg-bg-secondary border-b border-bg-surface">
        <div className="max-w-7xl mx-auto">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Comparare</span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-3">Compară proprietăți</h1>
          <p className="text-text-muted mt-4 max-w-2xl leading-relaxed">Selectează 2–3 proprietăți din listă pentru a vedea diferențele direct, înainte de contact.</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="max-w-7xl mx-auto border border-bg-surface bg-bg-card rounded-lg p-6 text-text-muted">Selectează proprietăți din listă pentru a activa comparația.</div>
      </section>
      <Footer />
    </main>
  )
}
