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
            Cumpără sau vinde
            <span className="text-accent block">fără haos și fără presiune</span>
          </h1>
          <p className="text-lg md:text-xl text-white/88 mb-10 max-w-2xl leading-relaxed">
            O listă scurtă de proprietăți relevante, prezentate clar, cu discuție directă despre preț, zonă și pașii următori.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr] max-w-2xl">
            <input type="text" placeholder="Caută zona, tip sau buget" className="form-input bg-white/95 text-text-primary placeholder:text-text-muted border-0" />
            <a href="/proprietati" className="bg-accent text-bg-primary px-7 py-3.5 rounded-lg font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-black/20 text-center">
              Vezi proprietăți
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <a href="/contact" className="border border-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors text-center">
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
