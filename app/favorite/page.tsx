"use client"

import { useEffect, useMemo, useState } from "react"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { Property, supabase } from "@/lib/supabase"
import Link from "next/link"

export default function FavoritePage() {
  const [all, setAll] = useState<Property[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("hq-favorites")
    if (stored) setSelected(JSON.parse(stored))
    supabase.from("properties").select("*").eq("status", "PUBLISHED").then(({ data }) => setAll(data || []))
  }, [])

  const items = useMemo(() => all.filter((p) => selected.includes(p.id)), [all, selected])

  const removeFavorite = (id: string) => {
    setSelected((curr) => {
      const next = curr.filter((x) => x !== id)
      localStorage.setItem("hq-favorites", JSON.stringify(next))
      return next
    })
  }

  const clearFavorites = () => {
    setSelected([])
    localStorage.removeItem("hq-favorites")
  }

  const addAllToCompare = () => {
    const ids = items.slice(0, 3).map((p) => p.id)
    localStorage.setItem("hq-compare", JSON.stringify(ids))
    window.location.href = "/comparare"
  }

  return (
    <main>
      <Header />
      <section className="px-4 py-16 bg-bg-secondary border-b border-bg-surface">
        <div className="max-w-7xl mx-auto">
          <span className="text-accent font-semibold text-xs uppercase tracking-widest">Favorite</span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-3">Proprietăți salvate</h1>
          <p className="text-text-muted mt-4 max-w-2xl leading-relaxed">Aici vezi anunțurile pe care le-ai salvat pentru revenire sau comparare.</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-text-muted">{items.length} salvate</div>
          <div className="flex items-center gap-3 flex-wrap">
            {items.length >= 2 && <button onClick={addAllToCompare} className="text-sm font-semibold text-accent">Compară selectatele</button>}
            <a href="/comparare" className="text-sm font-semibold text-accent">Comparare</a>
            {items.length > 0 && <button onClick={clearFavorites} className="text-sm font-semibold text-text-muted hover:text-accent">Golește lista</button>}
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          {items.length === 0 ? (
            <div className="border border-bg-surface bg-bg-card rounded-lg p-6 text-text-muted">Nu ai încă favorite. Adaugă proprietăți din listă și revino aici.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => (
                <div key={p.id} className="border border-bg-surface bg-bg-card rounded-lg p-5">
                  <h3 className="font-bold text-text-primary mb-2">{p.title}</h3>
                  <p className="text-sm text-text-muted mb-4">{[p.address, p.city, p.county].filter(Boolean).join(", ")}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-accent">EUR {p.price.toLocaleString("ro-RO")}</span>
                    <div className="flex gap-3">
                      <button onClick={() => removeFavorite(p.id)} className="text-sm font-semibold text-text-muted hover:text-accent">Scoate</button>
                      <Link href={`/proprietate/${p.slug}`} className="text-sm font-semibold text-accent">Vezi</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
