import { Plus } from "lucide-react"

const faqs = [
  {
    question: "Pot vedea proprietatile inainte sa iau o decizie?",
    answer: "Da. Programam vizionari doar dupa ce clarificam criteriile principale, ca sa nu pierzi timp cu variante nepotrivite.",
  },
  {
    question: "Lucrati si cu proprietari care vor sa vanda?",
    answer: "Da. Putem discuta pozitionarea pretului, prezentarea proprietatii si pasii practici pana la publicare.",
  },
  {
    question: "De ce sunt putine oferte pe site?",
    answer: "Preferam un portofoliu controlat. Este mai important ca fiecare oferta sa fie explicata corect decat sa afisam multe anunturi greu de verificat.",
  },
  {
    question: "Cat de repede primesc raspuns?",
    answer: "In zilele lucratoare raspundem de obicei in aceeasi zi. Pentru cereri trimise seara sau in weekend, revenim in urmatoarea zi lucratoare.",
  },
]

type CmsEntry = { content?: { headline?: string; items?: { q?: string; question?: string; a?: string; answer?: string }[] } }

export default function FAQ({ entry }: { entry?: CmsEntry | null }) {
  const items = entry?.content?.items || faqs

  return (
    <section className="bg-bg-primary px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Intrebari frecvente</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-text-primary md:text-5xl">{entry?.content?.headline || "Detalii care merita lamurite din start."}</h2>
        </div>
        <div className="grid gap-3">
          {items.map((item) => {
            const question = "question" in item ? item.question : item.q
            const answer = "answer" in item ? item.answer : item.a
            return <details key={question} className="group rounded-2xl border border-bg-surface bg-bg-card p-5 shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-text-primary">
                {question}
                <Plus className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 pr-8 text-sm leading-6 text-text-muted">{answer}</p>
            </details>
          })}
        </div>
      </div>
    </section>
  )
}
