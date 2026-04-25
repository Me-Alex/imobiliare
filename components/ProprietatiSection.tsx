"use client"
import { useState, useMemo } from "react"
import { proprietati } from "@/lib/proprietati"
import ProprietateCard from "./ProprietateCard"

const ZONE = ["Toate zonele", "Floreasca", "Băneasa", "Pipera", "Dorobanți", "Aviatorilor", "Tineretului"]

export default function ProprietatiSection() {
  const [filtruTip, setFiltruTip] = useState("toate")
  const [filtruTranzactie, setFiltruTranzactie] = useState("toate")
  const [filtruZona, setFiltruZona] = useState("Toate zonele")
  const [filtruCamere, setFiltruCamere] = useState(0)
  const [pretMax, setPretMax] = useState(1000000)
  const [showFiltre, setShowFiltre] = useState(false)

  const filtered = useMemo(() => proprietati.filter(p => {
    if (filtruTip !== "toate" && p.tip !== filtruTip) return false
    if (filtruTranzactie !== "toate" && p.tranzactie !== filtruTranzactie) return false
    if (filtruZona !== "Toate zonele" && p.zona !== filtruZona) return false
    if (filtruCamere > 0 && p.camere < filtruCamere) return false
    if (p.pret > pretMax) return false
    return true
  }), [filtruTip, filtruTranzactie, filtruZona, filtruCamere, pretMax])

  const resetFiltre = () => {
    setFiltruTip("toate"); setFiltruTranzactie("toate"); setFiltruZona("Toate zonele"); setFiltruCamere(0); setPretMax(1000000)
  }

  return (
    <section id="proprietati" className="py-20 px-4 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-accent font-semibold text-xs uppercase tracking-widest">Portofoliu</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Proprietăți disponibile</h2>
            <p className="text-text-muted mt-1 text-sm">{filtered.length} proprietăți găsite</p>
          </div>
          <button onClick={() => setShowFiltre(!showFiltre)}
            className="flex items-center gap-2 bg-bg-card border border-bg-surface px-4 py-2.5 rounded-xl text-sm text-text-primary hover:border-accent hover:text-accent transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filtre avansate
          </button>
        </div>

        {/* Filtre rapide tip + tranzactie */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["toate", "apartament", "casa", "vila"].map(tip => (
            <button key={tip} onClick={() => setFiltruTip(tip)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filtruTip === tip ? "bg-accent text-bg-primary border-accent" : "bg-bg-card text-text-muted border-bg-surface hover:border-accent hover:text-accent"}`}>
              {tip === "toate" ? "Toate tipurile" : tip.charAt(0).toUpperCase() + tip.slice(1)}
            </button>
          ))}
          <div className="w-px bg-bg-surface mx-1" />
          {["toate", "vanzare", "inchiriere"].map(tr => (
            <button key={tr} onClick={() => setFiltruTranzactie(tr)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filtruTranzactie === tr ? "bg-accent text-bg-primary border-accent" : "bg-bg-card text-text-muted border-bg-surface hover:border-accent hover:text-accent"}`}>
              {tr === "toate" ? "Vânzare & Închiriere" : tr.charAt(0).toUpperCase() + tr.slice(1)}
            </button>
          ))}
        </div>

        {/* Filtre avansate */}
        {showFiltre && (
          <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Zonă</label>
              <select value={filtruZona} onChange={e => setFiltruZona(e.target.value)}
                className="w-full bg-bg-secondary border border-bg-surface rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent">
                {ZONE.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Min. camere: <span className="text-accent">{filtruCamere === 0 ? "orice" : `${filtruCamere}+`}</span></label>
              <input type="range" min={0} max={6} step={1} value={filtruCamere} onChange={e => setFiltruCamere(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted mt-1"><span>Orice</span><span>6+</span></div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Preț max: <span className="text-accent">€{pretMax.toLocaleString("ro-RO")}</span></label>
              <input type="range" min={50000} max={1000000} step={10000} value={pretMax} onChange={e => setPretMax(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted mt-1"><span>€50k</span><span>€1M</span></div>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button onClick={resetFiltre} className="text-sm text-text-muted hover:text-accent transition-colors">Resetează filtrele</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => <ProprietateCard key={p.id} proprietate={p} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <div className="text-5xl mb-4">🏠</div>
            <p className="mb-4">Nicio proprietate pentru filtrele selectate.</p>
            <button onClick={resetFiltre} className="bg-accent text-bg-primary px-5 py-2 rounded-xl text-sm font-bold">Resetează filtrele</button>
          </div>
        )}
      </div>
    </section>
  )
}
