export default function Benefits() {
  const cards = [
    {
      title: "Mai puține anunțuri pierdute",
      text: "Ținem portofoliul scurt și actualizat, ca să nu suni pentru proprietăți care nu mai sunt disponibile.",
    },
    {
      title: "Răspuns cu informații utile",
      text: "Înainte de vizionare primești detaliile care contează: zonă, acte, costuri și eventuale minusuri.",
    },
    {
      title: "Proces fără presiune",
      text: "Te ajutăm să compari opțiunile și să mergi mai departe doar când oferta are sens pentru tine.",
    },
  ]

  return (
    <section className="py-20 px-4 bg-bg-secondary border-t border-bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Cum lucrăm</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Claritate înainte de vizionare</h2>
          <p className="text-text-muted mt-2 max-w-2xl">O proprietate bună se înțelege din primele minute. De aceea punem accent pe detalii concrete, nu pe descrieri pompoase.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map(card => (
            <div key={card.title} className="bg-bg-card border border-bg-surface rounded-2xl p-6 hover:border-accent/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">✓</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{card.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
