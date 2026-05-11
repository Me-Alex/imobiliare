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

export default function FAQ() {
  return (
    <section className="px-4 py-20 bg-bg-primary">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Intrebari frecvente</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Detalii care merita lamurite din start.</h2>
        </div>
        <div className="grid gap-3">
          {faqs.map((item) => (
            <details key={item.question} className="group border border-bg-surface bg-bg-card rounded-lg p-5">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-text-primary font-semibold">
                {item.question}
                <span className="text-accent group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-text-muted text-sm leading-relaxed mt-3 pr-8">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
