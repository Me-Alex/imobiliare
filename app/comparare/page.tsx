"use client"

import { useEffect, useMemo, useState } from "react"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { Property, supabase } from "@/lib/supabase"

export default function CompararePage() {
  const [all, setAll] = useState<Property[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("hq-compare")
    if (stored) setSelected(JSON.parse(stored))
    supabase.from("properties").select("*").eq("status", "PUBLISHED").then(({ data }) => setAll(data || []))
  }, [])

  const items = useMemo(() => all.filter((p) => selected.includes(p.id)).slice(0, 3), [all, selected])

  const rows = [
    ["Preț", (p: Property) => `EUR ${p.price.toLocaleString("ro-RO")}`],
    ["Oraș", (p: Property) => p.city],
    ["Zonă", (p: Property) => p.county],
    ["Suprafață", (p: Property) => `${p.area_sqm} mp`],
    ["Camere", (p: Property) => `${p.rooms}`],
    ["Băi", (p: Property) => `${p.bathrooms}`],
    ["Parcări", (p: Property) => `${p.parking_spots}`],
    ["Tip", (p: Property) => p.type],
  ] as const

  return (
    <main>
      <Header />
      <section className="px-4 py-16 bg-bg-secondary border-b border-bg-surface">
        <div className="max-w-7xl mx-auto">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Comparare</span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-3">Compară proprietăți</h1>
          <p className="text-text-muted mt-4 max-w-2xl leading-relaxed">Selectează 2–3 proprietăți din listă pentru a vedea diferențele direct, înainte de contact.</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="max-w-7xl mx-auto">
          {items.length < 2 ? (
            <div className="border border-bg-surface bg-bg-card rounded-lg p-6 text-text-muted">Selectează minim două proprietăți din listă pentru a activa comparația.</div>
          ) : (
            <div className="overflow-x-auto border border-bg-surface bg-bg-card rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-surface text-left">
                    <th className="p-4 text-text-muted font-medium">Câmp</th>
                    {items.map((p) => <th key={p.id} className="p-4 text-text-primary font-semibold min-w-[220px]">{p.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, getter]) => (
                    <tr key={label} className="border-b border-bg-surface last:border-0 align-top">
                      <td className="p-4 text-text-muted font-medium">{label}</td>
                      {items.map((p) => <td key={p.id} className="p-4 text-text-primary">{getter(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
