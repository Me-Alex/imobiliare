import { CalendarCheck2, ListChecks, SearchCheck } from "lucide-react"

const steps = [
  {
    icon: SearchCheck,
    title: "Clarificam criteriile",
    text: "Stabilim zona, bugetul, termenul si lucrurile la care nu vrei sa faci compromisuri.",
  },
  {
    icon: ListChecks,
    title: "Verificam variantele",
    text: "Punem in fata doar proprietati care au sens si explicam contextul fiecarei alegeri.",
  },
  {
    icon: CalendarCheck2,
    title: "Pregatim urmatorul pas",
    text: "Organizam vizionarea, actele si negocierea fara graba si fara presiune inutila.",
  },
]

export default function ProcessSection() {
  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Cum lucram</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-text-primary md:text-5xl">Un proces simplu, cu raspunsuri pe bune.</h2>
          <p className="mt-4 leading-8 text-text-muted">
            O decizie imobiliara buna nu are nevoie de presiune. Are nevoie de informatii clare, timp corect si oameni care raspund cand conteaza.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="rounded-2xl border border-bg-surface bg-bg-card p-6 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-bg-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-black text-text-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-black text-text-primary">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-muted">{step.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
