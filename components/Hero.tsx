export default function Hero() {
  const stats = [
    { num: "2+", label: "Oferte verificate" },
    { num: "24h", label: "Răspuns rapid" },
    { num: "1:1", label: "Discuție directă" },
    { num: "0", label: "Presiune inutilă" },
  ]

  return (
    <section className="relative bg-bg-primary py-24 px-4 overflow-hidden">
      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 bg-bg-card border border-bg-surface text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
          Imobiliare, dar fără alergătură inutilă
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-text-primary">
          Proprietăți explicate clar, pentru decizii luate în liniște.
        </h1>
        <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          Selectăm ofertele care merită văzute, punem detaliile importante la vedere și discutăm deschis despre preț, zonă și pașii următori.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="/proprietati" className="bg-accent text-bg-primary px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-accent/20">Vezi proprietăți</a>
          <a href="/contact" className="border border-bg-surface text-text-primary px-8 py-4 rounded-xl font-semibold text-base hover:border-accent hover:text-accent transition-all">Cere o recomandare</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ num, label }) => (
            <div key={label} className="bg-bg-card border border-bg-surface rounded-2xl p-5 text-left">
              <div className="text-2xl md:text-3xl font-bold text-accent">{num}</div>
              <div className="text-text-muted text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
