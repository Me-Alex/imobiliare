import { CheckCircle2 } from "lucide-react"

type CmsEntry = { content?: { headline?: string; body?: string; items?: { title: string; text: string }[] } }

export default function Benefits({ entry }: { entry?: CmsEntry | null }) {
  const cards = entry?.content?.items || [
    {
      title: "Mai putine anunturi pierdute",
      text: "Tinem portofoliul scurt si actualizat, ca sa nu suni pentru proprietati care nu mai sunt disponibile.",
    },
    {
      title: "Raspuns cu informatii utile",
      text: "Inainte de vizionare primesti detaliile care conteaza: zona, acte, costuri si eventuale minusuri.",
    },
    {
      title: "Proces fara presiune",
      text: "Te ajutam sa compari optiunile si sa mergi mai departe doar cand oferta are sens pentru tine.",
    },
  ]

  return (
    <section className="border-t border-bg-surface bg-bg-secondary px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">De ce conteaza</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-text-primary md:text-5xl">{entry?.content?.headline || "Claritate inainte de vizionare"}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-text-muted">
            {entry?.content?.body || "O proprietate buna se intelege din primele minute. De aceea punem accent pe date concrete, nu pe descrieri pompoase."}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-bg-surface bg-bg-card p-6 shadow-card transition-colors hover:border-accent/40">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-black text-text-primary">{card.title}</h3>
              <p className="text-sm leading-6 text-text-muted">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
