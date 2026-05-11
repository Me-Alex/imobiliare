"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Property, supabase } from "@/lib/supabase"
import ProprietateCard from "./ProprietateCard"

const ZONE = ["Toate zonele", "Corbeanca", "Bucuresti", "Floreasca", "Baneasa", "Pipera", "Dorobanti", "Aviatorilor"]
const TIPURI: Record<string, string> = {
  toate: "Toate",
  APARTMENT: "Apartamente",
  HOUSE: "Case",
  VILLA: "Vile",
  LAND: "Terenuri",
  COMMERCIAL: "Spatii comerciale",
}

const SORT_LABELS = {
  newest: "Cele mai noi",
  priceAsc: "Pret crescator",
  priceDesc: "Pret descrescator",
  areaDesc: "Suprafata mai mare",
} as const

type SortKey = keyof typeof SORT_LABELS

export default function ProprietatiSection() {
  const [proprietati, setProprietati] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [compare, setCompare] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>("newest")
  const [filtruTip, setFiltruTip] = useState("toate")
  const [filtruZona, setFiltruZona] = useState("Toate zonele")
  const [filtruCamere, setFiltruCamere] = useState(0)
  const [pretMax, setPretMax] = useState(1000000)
  const [doarFeatured, setDoarFeatured] = useState(false)
  const [showFiltre, setShowFiltre] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("hq-favorites")
    if (stored) setFavorites(JSON.parse(stored))
    const compareStored = localStorage.getItem("hq-compare")
    if (compareStored) setCompare(JSON.parse(compareStored))
    supabase
      .from("properties")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("Nu am putut incarca proprietatile. Incercam din nou in cateva momente.")
        setProprietati(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()

    return proprietati
      .filter((p) => {
        if (filtruTip !== "toate" && p.type !== filtruTip) return false
        if (filtruZona !== "Toate zonele" && p.city !== filtruZona) return false
        if (filtruCamere > 0 && p.rooms < filtruCamere) return false
        if (p.price > pretMax) return false
        if (doarFeatured && !p.featured) return false
        if (text) {
          const searchable = [p.title, p.city, p.county, p.address, p.description].filter(Boolean).join(" ").toLowerCase()
          if (!searchable.includes(text)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sort === "priceAsc") return a.price - b.price
        if (sort === "priceDesc") return b.price - a.price
        if (sort === "areaDesc") return b.area_sqm - a.area_sqm
        return new Date(b.created_at || b.published_at).getTime() - new Date(a.created_at || a.published_at).getTime()
      })
  }, [proprietati, filtruTip, filtruZona, filtruCamere, pretMax, doarFeatured, query, sort])

  const featuredCount = proprietati.filter((p) => p.featured).length
  const favoriteCount = favorites.length
  const activeFilters =
    query.trim() !== "" ||
    filtruTip !== "toate" ||
    filtruZona !== "Toate zonele" ||
    filtruCamere > 0 ||
    pretMax < 1000000 ||
    doarFeatured

  const toggleFavorite = (id: string) => {
    setFavorites((curr) => {
      const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
      localStorage.setItem("hq-favorites", JSON.stringify(next))
      return next
    })
  }

  const toggleCompare = (id: string) => {
    setCompare((curr) => {
      const next = curr.includes(id) ? curr.filter((x) => x !== id) : curr.length >= MAX_COMPARE ? curr : [...curr, id]
      localStorage.setItem("hq-compare", JSON.stringify(next))
      return next
    })
  }

  const resetFiltre = () => {
    setQuery("")
    setFiltruTip("toate")
    setFiltruZona("Toate zonele")
    setFiltruCamere(0)
    setPretMax(1000000)
    setDoarFeatured(false)
    setSort("newest")
  }

  return (
    <section id="proprietati" className="py-20 px-4 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="text-accent font-semibold text-xs uppercase tracking-widest">Portofoliu curat</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Proprietati pregatite pentru o decizie buna</h2>
            <p className="text-text-muted mt-3 text-base leading-relaxed">
              Cautam sa afisam doar oferte pe care le putem explica limpede: pret, zona, acte, stare reala si urmatorul pas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[420px]">
            <div className="border border-bg-surface bg-bg-card rounded-lg p-3">
              <div className="text-xl font-bold text-text-primary">{proprietati.length}</div>
              <div className="text-xs text-text-muted">active</div>
            </div>
            <div className="border border-bg-surface bg-bg-card rounded-lg p-3">
              <div className="text-xl font-bold text-text-primary">{featuredCount}</div>
              <div className="text-xs text-text-muted">selectate</div>
            </div>
            <div className="border border-bg-surface bg-bg-card rounded-lg p-3">
              <div className="text-xl font-bold text-text-primary">{favoriteCount}</div>
              <div className="text-xs text-text-muted">favorite</div>
            </div>
          </div>
        </div>

        <div className="border border-bg-surface bg-bg-card rounded-lg p-3 md:p-4 mb-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_120px]">
            <label className="relative block">
              <span className="sr-only">Cauta proprietati</span>
              <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 bg-bg-secondary border border-bg-surface rounded-lg pl-11 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted/70"
                placeholder="Cauta dupa zona, oras, adresa sau tip de proprietate"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 bg-bg-secondary border border-bg-surface rounded-lg px-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFiltre(!showFiltre)}
              className={`h-11 inline-flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold border transition-all ${showFiltre ? "bg-accent text-bg-primary border-accent" : "bg-bg-secondary text-text-primary border-bg-surface hover:border-accent hover:text-accent"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M10 20h4" />
              </svg>
              Filtre
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {Object.entries(TIPURI).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFiltruTip(val)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${filtruTip === val ? "bg-accent text-bg-primary border-accent" : "bg-bg-secondary text-text-muted border-bg-surface hover:border-accent hover:text-accent"}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setDoarFeatured(!doarFeatured)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${doarFeatured ? "bg-accent text-bg-primary border-accent" : "bg-bg-secondary text-text-muted border-bg-surface hover:border-accent hover:text-accent"}`}
            >
              Selectate de echipa
            </button>
          </div>

          {showFiltre && (
            <div className="grid grid-cols-1 gap-5 mt-5 pt-5 border-t border-bg-surface md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Zona / oras</label>
                <select value={filtruZona} onChange={(e) => setFiltruZona(e.target.value)}
                  className="w-full bg-bg-secondary border border-bg-surface rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent">
                  {ZONE.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                  Camere: <span className="text-accent">{filtruCamere === 0 ? "orice" : `${filtruCamere}+`}</span>
                </label>
                <input type="range" min={0} max={6} step={1} value={filtruCamere} onChange={(e) => setFiltruCamere(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>Orice</span><span>6+</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                  Buget maxim: <span className="text-accent">EUR {pretMax.toLocaleString("ro-RO")}</span>
                </label>
                <input type="range" min={50000} max={1000000} step={10000} value={pretMax} onChange={(e) => setPretMax(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>EUR 50k</span><span>EUR 1M+</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            {loading ? "Se incarca proprietatile..." : `${filtered.length} ${filtered.length === 1 ? "rezultat gasit" : "rezultate gasite"}`}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/comparare" className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-all ${compare.length >= 2 ? 'bg-accent text-bg-primary border-accent' : 'bg-bg-secondary text-text-muted border-bg-surface pointer-events-none opacity-50'}`}>
              Compară ({compare.length})
            </Link>
            {activeFilters && (
              <button onClick={resetFiltre} className="text-sm font-semibold text-accent hover:text-text-primary transition-colors">
                Reseteaza cautarea
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-sm text-text-primary">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="bg-bg-card border border-bg-surface rounded-lg h-80 animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => <ProprietateCard key={p.id} proprietate={p} isFavorite={favorites.includes(p.id)} isCompared={compare.includes(p.id)} onToggleFavorite={() => toggleFavorite(p.id)} onToggleCompare={() => toggleCompare(p.id)} />)}
          </div>
        ) : (
          <div className="text-center py-16 px-6 border border-bg-surface bg-bg-card rounded-lg">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Nu am gasit o potrivire exacta.</h3>
            <p className="text-text-muted text-sm max-w-xl mx-auto mb-5">
              Spune-ne ce cauti si putem verifica oferte care nu sunt inca publicate sau proprietati aflate in pregatire.
            </p>
            <button onClick={resetFiltre} className="bg-accent text-bg-primary px-5 py-2.5 rounded-lg text-sm font-bold">Reseteaza filtrele</button>
          </div>
        )}
      </div>
    </section>
  )
}
