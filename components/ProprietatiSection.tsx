"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Property, supabase } from "@/lib/supabase"
import ProprietateCard from "./ProprietateCard"
import { scoreProperty } from "@/lib/experience"
import {
  COMPARE_KEY,
  DEFAULT_BUYER_INTENT,
  FAVORITES_KEY,
  readBuyerIntent,
  readRecentPropertyViews,
  readSavedSearches,
  readStoredIds,
  subscribeClientPreferences,
  writeSavedSearches,
  type BuyerIntent,
  type RecentPropertyView,
  type SavedSearch,
} from "@/lib/client-preferences"

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
  match: "Potrivire profil",
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
  const [sort, setSort] = useState<SortKey>("newest")
  const [filtruTip, setFiltruTip] = useState("toate")
  const [filtruZona, setFiltruZona] = useState("Toate zonele")
  const [filtruCamere, setFiltruCamere] = useState(0)
  const [pretMax, setPretMax] = useState(1000000)
  const [suprafataMin, setSuprafataMin] = useState(0)
  const [doarFeatured, setDoarFeatured] = useState(false)
  const [showFiltre, setShowFiltre] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [buyerIntent, setBuyerIntent] = useState<BuyerIntent>(DEFAULT_BUYER_INTENT)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [recentViews, setRecentViews] = useState<RecentPropertyView[]>([])

  useEffect(() => {
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

  useEffect(() => {
    const syncSelection = () => {
      setFavoriteIds(readStoredIds(FAVORITES_KEY))
      setCompareIds(readStoredIds(COMPARE_KEY))
      setBuyerIntent(readBuyerIntent())
      setSavedSearches(readSavedSearches())
      setRecentViews(readRecentPropertyViews())
    }
    syncSelection()
    return subscribeClientPreferences(syncSelection)
  }, [])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()

    return proprietati
      .filter((p) => {
        if (filtruTip !== "toate" && p.type !== filtruTip) return false
        if (filtruZona !== "Toate zonele" && p.city !== filtruZona) return false
        if (filtruCamere > 0 && p.rooms < filtruCamere) return false
        if (p.price > pretMax) return false
        if (suprafataMin > 0 && p.area_sqm < suprafataMin) return false
        if (doarFeatured && !p.featured) return false
        if (text) {
          const searchable = [p.title, p.city, p.county, p.address, p.description].filter(Boolean).join(" ").toLowerCase()
          if (!searchable.includes(text)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sort === "match") return scoreProperty(b, buyerIntent).score - scoreProperty(a, buyerIntent).score
        if (sort === "priceAsc") return a.price - b.price
        if (sort === "priceDesc") return b.price - a.price
        if (sort === "areaDesc") return b.area_sqm - a.area_sqm
        return new Date(b.created_at || b.published_at).getTime() - new Date(a.created_at || a.published_at).getTime()
      })
  }, [proprietati, filtruTip, filtruZona, filtruCamere, pretMax, suprafataMin, doarFeatured, query, sort, buyerIntent])

  const scoredFiltered = useMemo(() => filtered.map((property) => ({ property, ...scoreProperty(property, buyerIntent) })), [filtered, buyerIntent])

  const featuredCount = proprietati.filter((p) => p.featured).length
  const activeFilters =
    query.trim() !== "" ||
    filtruTip !== "toate" ||
    filtruZona !== "Toate zonele" ||
    filtruCamere > 0 ||
    pretMax < 1000000 ||
    suprafataMin > 0 ||
    doarFeatured

  const resetFiltre = () => {
    setQuery("")
    setFiltruTip("toate")
    setFiltruZona("Toate zonele")
    setFiltruCamere(0)
    setPretMax(1000000)
    setSuprafataMin(0)
    setDoarFeatured(false)
    setSort("newest")
  }

  const applyBuyerIntent = () => {
    setPretMax(buyerIntent.budget)
    setFiltruCamere(buyerIntent.rooms)
    if (buyerIntent.area !== "orice") setFiltruZona(buyerIntent.area)
    setSort("match")
  }

  const saveSearch = () => {
    const labelParts = [
      query.trim() || TIPURI[filtruTip] || "Portofoliu",
      filtruZona !== "Toate zonele" ? filtruZona : null,
      filtruCamere > 0 ? `${filtruCamere}+ camere` : null,
      pretMax < 1000000 ? `sub EUR ${pretMax.toLocaleString("ro-RO")}` : null,
    ].filter(Boolean)
    const next: SavedSearch = {
      id: String(Date.now()),
      label: labelParts.join(" / ") || "Cautare HQS",
      query,
      type: filtruTip,
      zone: filtruZona,
      rooms: filtruCamere,
      maxPrice: pretMax,
      minArea: suprafataMin,
      featuredOnly: doarFeatured,
      results: filtered.length,
      createdAt: new Date().toISOString(),
    }
    const updated = [next, ...savedSearches.filter((item) => item.label !== next.label)].slice(0, 6)
    setSavedSearches(updated)
    writeSavedSearches(updated)
  }

  const applySavedSearch = (search: SavedSearch) => {
    setQuery(search.query)
    setFiltruTip(search.type)
    setFiltruZona(search.zone)
    setFiltruCamere(search.rooms)
    setPretMax(search.maxPrice)
    setSuprafataMin(search.minArea)
    setDoarFeatured(search.featuredOnly)
  }

  const favoriteRows = proprietati.filter((p) => favoriteIds.includes(p.id))
  const compareRows = proprietati.filter((p) => compareIds.includes(p.id))
  const clearSelection = (key: typeof FAVORITES_KEY | typeof COMPARE_KEY) => {
    localStorage.removeItem(key)
    window.dispatchEvent(new Event("hqs-selection"))
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
              <div className="text-xl font-bold text-text-primary">24h</div>
              <div className="text-xs text-text-muted">raspuns</div>
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
            <div className="grid grid-cols-1 gap-5 mt-5 pt-5 border-t border-bg-surface md:grid-cols-4">
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
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                  Suprafata minima: <span className="text-accent">{suprafataMin === 0 ? "orice" : `${suprafataMin} mp`}</span>
                </label>
                <input type="range" min={0} max={300} step={10} value={suprafataMin} onChange={(e) => setSuprafataMin(Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>Orice</span><span>300 mp</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Profil cumparator</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <span className="rounded-lg bg-bg-secondary px-3 py-2 text-text-muted">EUR {buyerIntent.budget.toLocaleString("ro-RO")}</span>
              <span className="rounded-lg bg-bg-secondary px-3 py-2 text-text-muted">{buyerIntent.area === "orice" ? "orice zona" : buyerIntent.area}</span>
              <span className="rounded-lg bg-bg-secondary px-3 py-2 text-text-muted">{buyerIntent.rooms}+ camere</span>
            </div>
            <button onClick={applyBuyerIntent} className="mt-3 w-full rounded-lg border border-accent/40 px-4 py-2 text-sm font-bold text-accent hover:bg-accent hover:text-bg-primary">
              Aplica profilul in cautare
            </button>
          </div>

          <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Cautari salvate</p>
              <button onClick={saveSearch} className="text-xs font-black text-accent">Salveaza</button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {savedSearches.length ? savedSearches.map((search) => (
                <button key={search.id} onClick={() => applySavedSearch(search)} className="shrink-0 rounded-lg border border-bg-surface bg-bg-secondary px-3 py-2 text-left text-xs text-text-muted hover:border-accent hover:text-accent">
                  <span className="block font-bold text-text-primary">{search.label}</span>
                  <span>{search.results} rezultate</span>
                </button>
              )) : <p className="text-sm text-text-muted">Salveaza o combinatie de filtre ca sa o refolosesti rapid.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Vizualizate recent</p>
            <div className="mt-3 grid gap-2">
              {recentViews.length ? recentViews.slice(0, 2).map((view) => (
                <Link key={view.id} href={`/proprietate/${view.slug}`} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-muted hover:text-accent">
                  <span className="block font-bold text-text-primary line-clamp-1">{view.title}</span>
                  <span>{view.city || "HQS"}{view.price ? ` - EUR ${view.price.toLocaleString("ro-RO")}` : ""}</span>
                </Link>
              )) : <p className="text-sm text-text-muted">Deschide o proprietate si o vei regasi aici.</p>}
            </div>
          </div>
        </div>

        {(favoriteRows.length > 0 || compareRows.length > 0) && (
          <div className="grid gap-4 mb-6 lg:grid-cols-2">
            {favoriteRows.length > 0 && (
              <div className="border border-bg-surface bg-bg-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-text-primary">Favorite salvate</h3>
                  <button onClick={() => clearSelection("hqs-favorites")} className="text-xs font-bold text-accent">Goleste</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favoriteRows.map((p) => <Link key={p.id} href={`/proprietate/${p.slug}`} className="shrink-0 rounded-lg border border-bg-surface px-3 py-2 text-sm text-text-muted hover:border-accent hover:text-accent">{p.title}</Link>)}
                </div>
              </div>
            )}
            {compareRows.length > 0 && (
              <div className="border border-bg-surface bg-bg-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-text-primary">Comparatie rapida</h3>
                  <button onClick={() => clearSelection("hqs-compare")} className="text-xs font-bold text-accent">Goleste</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {compareRows.map((p) => (
                    <div key={p.id} className="rounded-lg bg-bg-secondary p-3">
                      <Link href={`/proprietate/${p.slug}`} className="font-bold text-sm text-text-primary hover:text-accent line-clamp-1">{p.title}</Link>
                      <p className="text-xs text-text-muted mt-1">{p.city} - {p.rooms || "-"} camere - {p.area_sqm} mp</p>
                      <p className="text-sm font-black text-accent mt-2">EUR {p.price.toLocaleString("ro-RO")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            {loading ? "Se incarca proprietatile..." : `${filtered.length} ${filtered.length === 1 ? "rezultat gasit" : "rezultate gasite"}`}
          </p>
          {activeFilters && (
            <button onClick={resetFiltre} className="text-sm font-semibold text-accent hover:text-text-primary transition-colors">
              Reseteaza cautarea
            </button>
          )}
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
        ) : scoredFiltered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scoredFiltered.map(({ property, score, reasons }) => <ProprietateCard key={property.id} proprietate={property} matchScore={score} matchReasons={reasons} />)}
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
