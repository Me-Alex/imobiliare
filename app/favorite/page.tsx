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
        <div className="max-w-7xl mx-auto">
          {items.length === 0 ? (
            <div className="border border-bg-surface bg-bg-card rounded-lg p-6 text-text-muted">Nu ai încă favorite. Adaugă proprietăți din listă și revino aici.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => (
                <div key={p.id} className="border border-bg-surface bg-bg-card rounded-lg p-5">
                  <h3 className="font-bold text-text-primary mb-2">{p.title}</h3>
                  <p className="text-sm text-text-muted mb-4">{[p.address, p.city, p.county].filter(Boolean).join(", ")}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accent">EUR {p.price.toLocaleString("ro-RO")}</span>
                    <Link href={`/proprietate/${p.slug}`} className="text-sm font-semibold text-accent">Vezi</Link>
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
