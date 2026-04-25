export default function Hero() {
  const stats = [
    { num: '500+', label: 'Proprietăți' },
    { num: '24h', label: 'Timp de răspuns' },
    { num: '100%', label: 'Prezentare clară' },
    { num: '1:1', label: 'Consultanță dedicată' },
  ]

  return (
    <section className="relative bg-bg-primary py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 bg-bg-card border border-bg-surface text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
          Selectat actual
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-text-primary">
          Proprietăți atent selectate pentru
          <span className="text-accent"> cumpărători</span> și investitori.
        </h1>
        <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          Găsești mai repede o proprietate potrivită când ai prezentare clară, selecție relevantă și un proces simplu de la prima vizită până la ofertă.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="#proprietati" className="bg-accent text-bg-primary px-8 py-4 rounded-xl font-bold text-base hover:bg-green-400 transition-all transform hover:scale-105 shadow-lg shadow-accent/20">Vezi proprietăți</a>
          <a href="#contact" className="border border-bg-surface text-text-primary px-8 py-4 rounded-xl font-semibold text-base hover:border-accent hover:text-accent transition-all">Discută cu noi</a>
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
