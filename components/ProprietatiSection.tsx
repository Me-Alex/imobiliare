"use client"
import { useState } from "react"
import { proprietati, Proprietate } from "@/lib/proprietati"
import ProprietateCard from "./ProprietateCard"

export default function ProprietatiSection() {
  const [filtruTip, setFiltruTip] = useState<string>("toate")
  const [filtruTranzactie, setFiltruTranzactie] = useState<string>("toate")

  const filtered = proprietati.filter(p => {
    const tipOk = filtruTip === "toate" || p.tip === filtruTip
    const tranzOk = filtruTranzactie === "toate" || p.tranzactie === filtruTranzactie
    return tipOk && tranzOk
  })

  return (
    <section id="proprietati" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-widest">Portofoliu</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a3c5e] mt-2">Proprietăți disponibile</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Selecție atentă de proprietăți premium în cele mai căutate zone din București</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {["toate", "apartament", "casa", "vila"].map(tip => (
            <button key={tip} onClick={() => setFiltruTip(tip)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                filtruTip === tip ? "bg-[#1a3c5e] text-white border-[#1a3c5e]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a3c5e]"
              }`}>
              {tip === "toate" ? "Toate tipurile" : tip.charAt(0).toUpperCase() + tip.slice(1)}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {["toate", "vanzare", "inchiriere"].map(tr => (
            <button key={tr} onClick={() => setFiltruTranzactie(tr)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                filtruTranzactie === tr ? "bg-[#c9a84c] text-white border-[#c9a84c]" : "bg-white text-gray-600 border-gray-200 hover:border-[#c9a84c]"
              }`}>
              {tr === "toate" ? "Vânzare & Închiriere" : tr.charAt(0).toUpperCase() + tr.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(p => <ProprietateCard key={p.id} proprietate={p} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-lg">Nicio proprietate găsită pentru filtrele selectate.</p>
          </div>
        )}
      </div>
    </section>
  )
}
