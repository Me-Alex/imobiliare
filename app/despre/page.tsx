import Benefits from "@/components/Benefits"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import ProcessSection from "@/components/ProcessSection"

export const metadata = {
  title: "Despre HQS Imobiliare",
  description: "Cum lucram cu proprietarii, cumparatorii si chiriasii.",
}

export default function DesprePage() {
  return (
    <main>
      <Header />
      <section className="px-4 py-20 bg-bg-primary">
        <div className="max-w-5xl mx-auto">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Despre noi</span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-3">Lucram cu putine proprietati, dar le tratam serios.</h1>
          <p className="text-text-muted mt-6 text-lg leading-relaxed max-w-3xl">
            HQS Imobiliare este construit pentru oameni care vor raspunsuri clare: ce cumpar, cat merita, ce acte verific si care este urmatorul pas. Preferam prezentarile oneste, fotografiile curate si discutiile directe.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              ["Verificare", "Strangem datele de baza inainte ca oferta sa ajunga pe site."],
              ["Context", "Explicam zona, pretul si lucrurile care pot conta la revanzare."],
              ["Ritm normal", "Programam vizionari fara presiune si fara mesaje insistente."],
            ].map(([title, text]) => (
              <div key={title} className="bg-bg-card border border-bg-surface rounded-lg p-6">
                <h2 className="text-text-primary font-semibold">{title}</h2>
                <p className="text-text-muted text-sm leading-relaxed mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ProcessSection />
      <Benefits />
      <Footer />
    </main>
  )
}
