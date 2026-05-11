const steps = [
  {
    title: "Clarificam criteriile",
    text: "Stabilim zona, bugetul, termenul si lucrurile la care nu vrei sa faci compromisuri.",
  },
  {
    title: "Verificam variantele",
    text: "Punem in fata doar proprietati care au sens si explicam contextul fiecarei alegeri.",
  },
  {
    title: "Pregatim urmatorul pas",
    text: "Organizam vizionarea, actele si negocierea fara graba si fara presiune inutila.",
  },
]

export default function ProcessSection() {
  return (
    <section className="px-4 py-20 bg-bg-secondary border-y border-bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-10">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Cum lucram</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Un proces simplu, cu raspunsuri pe bune.</h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            O decizie imobiliara buna nu are nevoie de presiune. Are nevoie de informatii clare, timp corect si oameni care raspund cand conteaza.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="bg-bg-card border border-bg-surface rounded-lg p-6">
              <div className="w-10 h-10 rounded-lg bg-accent text-bg-primary flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mt-5">{step.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed mt-3">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
