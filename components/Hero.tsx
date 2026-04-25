export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-[#1a3c5e] to-[#0d2137] text-white py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')"}}></div>
      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-block bg-[#c9a84c] text-white text-xs font-semibold px-4 py-1 rounded-full mb-6 uppercase tracking-widest">
          Agenție Premium București
        </span>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Găsește proprietatea
          <span className="text-[#c9a84c]"> perfectă</span>
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Apartamente, case și vile premium în cele mai căutate zone din București. Consultanță gratuită.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#proprietati" className="bg-[#c9a84c] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#b8963e] transition-all transform hover:scale-105 shadow-lg">
            Vezi proprietăți
          </a>
          <a href="#contact" className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-[#1a3c5e] transition-all">
            Consultanță gratuită
          </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[["500+", "Proprietăți"], ["98%", "Clienți mulțumiți"], ["10+", "Ani experiență"]].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-[#c9a84c]">{num}</div>
              <div className="text-blue-200 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
