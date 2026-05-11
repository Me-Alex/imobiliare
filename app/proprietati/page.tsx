import Footer from "@/components/Footer"
import Header from "@/components/Header"
import ProprietatiSection from "@/components/ProprietatiSection"

export const metadata = {
  title: "Proprietati disponibile | HQS Imobiliare",
  description: "Apartamente, case, vile si terenuri verificate de HQS Imobiliare.",
}

export default function ProprietatiPage() {
  return (
    <main>
      <Header />
      <section className="bg-bg-secondary px-4 py-16 border-b border-bg-surface">
        <div className="max-w-7xl mx-auto">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Portofoliu</span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-3">Proprietati disponibile</h1>
          <p className="text-text-muted mt-4 max-w-2xl leading-relaxed">
            O lista scurta si verificata este mai utila decat zeci de anunturi neclare. Aici gasesti ofertele pe care le putem prezenta rapid, cu informatiile importante la zi.
          </p>
        </div>
      </section>
      <ProprietatiSection />
      <Footer />
    </main>
  )
}
