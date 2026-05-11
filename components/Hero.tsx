export default function Hero() {
  const stats = [
    { num: "2+", label: "Oferte verificate" },
    { num: "24h", label: "Raspuns rapid" },
    { num: "1:1", label: "Discutie directa" },
    { num: "0", label: "Presiune inutila" },
  ]

  return (
    <section className="relative min-h-[720px] px-4 overflow-hidden bg-bg-primary">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1800&q=85"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-primary to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto pt-28 pb-12 min-h-[720px] flex flex-col justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center border border-white/20 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-7 uppercase tracking-widest backdrop-blur">
            Imobiliare explicate clar
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
            Proprietati alese cu grija, pentru decizii luate in liniste.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-9 max-w-2xl leading-relaxed">
            Selectam ofertele care merita vazute, verificam detaliile importante si discutam deschis despre pret, zona si pasii urmatori.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/proprietati" className="bg-accent text-bg-primary px-7 py-3.5 rounded-lg font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-black/20">
              Vezi proprietati
            </a>
            <a href="/contact" className="border border-white/30 text-white px-7 py-3.5 rounded-lg font-semibold text-base hover:bg-white hover:text-black transition-all">
              Cere o recomandare
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16">
          {stats.map(({ num, label }) => (
            <div key={label} className="bg-bg-card/95 border border-white/10 rounded-lg p-5 text-left backdrop-blur">
              <div className="text-2xl md:text-3xl font-bold text-accent">{num}</div>
              <div className="text-text-muted text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
