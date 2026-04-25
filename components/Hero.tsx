export default function Hero() {
  const stats = [
    { num: "500+", label: "Proprietăți" },
    { num: "98%", label: "Clienți mulțumiți" },
    { num: "10+", label: "Ani experiență" },
  ]
  return (
    <section className="relative bg-bg-primary py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent opacity-5 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 bg-bg-card border border-bg-surface text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          Agenție Premium București
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-text-primary">
          Proprietăți atent selectate<br />
          <span className="text-accent">pentru cumpărători</span> și investitori.
        </h1>
        <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          Găsești mai repede o proprietate potrivită când ai prezentare clară, selecție relevantă și un proces simplu de la prima vizită până la ofertă.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <a href="#proprietati" className="bg-accent text-bg-primary px-8 py-4 rounded-xl font-bold text-base hover:bg-green-400 transition-all transform hover:scale-105 shadow-lg shadow-accent/20">
            Vezi proprietăți
          </a>
          <a href="#contact" className="border border-bg-surface text-text-primary px-8 py-4 rounded-xl font-semibold text-base hover:border-accent hover:text-accent transition-all">
            Discută cu noi
          </a>
        </div>
        <div className="grid grid-cols-3 gap-8 max-w-md mx-auto border-t border-bg-surface pt-8">
          {stats.map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-accent">{num}</div>
              <div className="text-text-muted text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
