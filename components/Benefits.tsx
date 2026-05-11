export default function Benefits() {
  const cards = [
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
    <section className="py-20 px-4 bg-bg-secondary border-t border-bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">De ce conteaza</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Claritate inainte de vizionare</h2>
          <p className="text-text-muted mt-3 max-w-2xl leading-relaxed">
            O proprietate buna se intelege din primele minute. De aceea punem accent pe date concrete, nu pe descrieri pompoase.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div key={card.title} className="bg-bg-card border border-bg-surface rounded-lg p-6 hover:border-accent/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{card.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
