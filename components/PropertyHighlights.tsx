import { ArrowRight, BadgeCheck, ClipboardCheck, Handshake, ShieldCheck } from "lucide-react"

const checks = [
  { icon: BadgeCheck, label: "Pret explicat", text: "Comparam oferta cu zona, suprafata si starea reala, nu doar cu titlul anuntului." },
  { icon: ClipboardCheck, label: "Detalii verificate", text: "Punem in fata actele, disponibilitatea, costurile probabile si pasii urmatori." },
  { icon: Handshake, label: "Discutie directa", text: "Recomandarea vine cu argumente clare, astfel incat shortlist-ul ramane scurt." },
]

export default function PropertyHighlights() {
  return (
    <section className="relative overflow-hidden border-y border-bg-surface bg-bg-primary px-4 py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg-secondary/70 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="max-w-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-text-primary md:text-5xl">Dupa primul click, ramai cu lucrurile care conteaza.</h2>
          <p className="mt-5 text-base leading-8 text-text-muted">
            Fiecare oferta este filtrata prin context real: pret, zona, acte, costuri probabile si urmatorul pas potrivit pentru tine.
          </p>
        </div>

        <div className="grid gap-3">
          {checks.map(({ icon: Icon, label, text }, index) => (
            <div key={label} className="group grid gap-4 rounded-lg border border-bg-surface bg-bg-card/88 p-5 shadow-card transition-colors hover:border-accent/60 md:grid-cols-[48px_1fr_auto] md:items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-secondary text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">0{index + 1}</div>
                <h3 className="mt-1 text-lg font-black text-text-primary">{label}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">{text}</p>
              </div>
              <ArrowRight className="hidden h-5 w-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent md:block" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
