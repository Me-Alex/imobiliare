"use client"
import { useState } from "react"
import { proprietati } from "@/lib/proprietati"
import ProprietateCard from "./ProprietateCard"

const tipuri = ["toate", "apartament", "casa", "vila"]
const tranzactii = ["toate", "vanzare", "inchiriere"]

export default function ProprietatiSection() {
  const [filtruTip, setFiltruTip] = useState("toate")
  const [filtruTranzactie, setFiltruTranzactie] = useState("toate")

  const filtered = proprietati.filter(p =>
    (filtruTip === "toate" || p.tip === filtruTip) &&
    (filtruTranzactie === "toate" || p.tranzactie === filtruTranzactie)
  )

  return (
    <section id="proprietati" className="py-20 px-4 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Portofoliu</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Proprietăți disponibile</h2>
          <p className="text-text-muted mt-2 max-w-xl">Selecție atentă de proprietăți premium în cele mai căutate zone din București</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {tipuri.map(tip => (
            <button key={tip} onClick={() => setFiltruTip(tip)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                filtruTip === tip
                  ? "bg-accent text-bg-primary border-accent"
                  : "bg-bg-card text-text-muted border-bg-surface hover:border-accent hover:text-accent"
              }`}>
              {tip === "toate" ? "Toate tipurile" : tip.charAt(0).toUpperCase() + tip.slice(1)}
            </button>
          ))}
          <div className="w-px bg-bg-surface mx-1" />
          {tranzactii.map(tr => (
            <button key={tr} onClick={() => setFiltruTranzactie(tr)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                filtruTranzactie === tr
                  ? "bg-accent text-bg-primary border-accent"
                  : "bg-bg-card text-text-muted border-bg-surface hover:border-accent hover:text-accent"
              }`}>
              {tr === "toate" ? "Vânzare & Închiriere" : tr.charAt(0).toUpperCase() + tr.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => <ProprietateCard key={p.id} proprietate={p} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <div className="text-5xl mb-4">🏠</div>
            <p>Nicio proprietate pentru filtrele selectate.</p>
          </div>
        )}
      </div>
    </section>
  )
}
