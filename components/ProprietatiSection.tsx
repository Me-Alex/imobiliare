"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { BookmarkPlus, Heart, RotateCcw, Search, SlidersHorizontal, Target } from "lucide-react"
import type { Property } from "@/lib/supabase"
import ProprietateCard from "./ProprietateCard"
import { scoreProperty } from "@/lib/experience"
import {
  COMPARE_KEY,
  DEFAULT_BUYER_INTENT,
  FAVORITES_KEY,
  clearStoredIds,
  readBuyerIntent,
  readSavedSearches,
  readStoredIds,
  subscribeClientPreferences,
  writeSavedSearches,
  type BuyerIntent,
  type SavedSearch,
} from "@/lib/client-preferences"
import { formatCurrency } from "@/lib/format"

const DEFAULT_ZONES = ["Bucuresti", "Floreasca", "Baneasa", "Pipera", "Dorobanti", "Aviatorilor", "Corbeanca"]
const TIPURI: Record<string, string> = {
  toate: "Toate",
  APARTMENT: "Apartamente",
  HOUSE: "Case",
  VILLA: "Vile",
  LAND: "Terenuri",
  COMMERCIAL: "Comercial",
}

const SORT_LABELS = {
  newest: "Cele mai noi",
  match: "Potrivire profil",
  priceAsc: "Pret crescator",
  priceDesc: "Pret descrescator",
  areaDesc: "Suprafata mare",
} as const

const PRICE_CEILING = 1000000

type SortKey = keyof typeof SORT_LABELS

type Props = {
  initialProperties?: Property[]
  initialTotal?: number
  initialHasMore?: boolean
  initialPageSize?: number
  initialQuery?: string
  initialZone?: string
  initialType?: string
  initialBudget?: number
  initialRooms?: number
  initialMinArea?: number
  initialFeaturedOnly?: boolean
  initialSort?: SortKey
  initialZones?: string[]
}

export default function ProprietatiSection({
  initialProperties = [],
  initialTotal = initialProperties.length,
  initialHasMore = false,
  initialPageSize = 12,
  initialQuery = "",
  initialZone = "Toate zonele",
  initialType = "toate",
  initialBudget,
  initialRooms = 0,
  initialMinArea = 0,
  initialFeaturedOnly = false,
  initialSort = "newest",
  initialZones = [],
}: Props) {
  const [proprietati, setProprietati] = useState<Property[]>(initialProperties)
  const [loading, setLoading] = useState(initialProperties.length === 0)
  const [error, setError] = useState("")
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<{ type: string; value: string }[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [queryFocused, setQueryFocused] = useState(false)
  const [sort, setSort] = useState<SortKey>(initialSort)
  const [filtruTip, setFiltruTip] = useState(TIPURI[initialType] ? initialType : "toate")
  const [zones, setZones] = useState(["Toate zonele", ...Array.from(new Set([initialZone, ...(initialZones || []), ...DEFAULT_ZONES])).filter((zone) => zone && zone !== "Toate zonele")])
  const [filtruZona, setFiltruZona] = useState(initialZone || "Toate zonele")
  const [filtruCamere, setFiltruCamere] = useState(initialRooms)
  const [pretMax, setPretMax] = useState(initialBudget || 0)
  const [suprafataMin, setSuprafataMin] = useState(initialMinArea)
  const [doarFeatured, setDoarFeatured] = useState(initialFeaturedOnly)
  const [showFiltre, setShowFiltre] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [buyerIntent, setBuyerIntent] = useState<BuyerIntent>(DEFAULT_BUYER_INTENT)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const didHydrate = useRef(false)

  useEffect(() => {
    fetch("/api/search/suggestions")
      .then((res) => res.ok ? res.json() : null)
      .then((body) => {
        const next = Array.isArray(body?.suggestions)
          ? body.suggestions.filter((item: any) => item.type === "zone").map((item: any) => String(item.value)).filter(Boolean)
          : []
        if (next.length) setZones(["Toate zonele", ...Array.from(new Set([...next, ...DEFAULT_ZONES]))])
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((res) => res.ok ? res.json() : null)
        .then((body) => {
          const next = Array.isArray(body?.suggestions)
            ? body.suggestions
              .filter((item: any) => item && typeof item === "object")
              .map((item: any) => ({ type: String(item.type || "zone"), value: String(item.value || "").trim() }))
              .filter((item: any) => item.value)
            : []
          setSuggestions(next)
          setSuggestOpen(queryFocused && Boolean(next.length))
        })
        .catch(() => undefined)
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query, queryFocused])

  useEffect(() => {
    const syncSelection = () => {
      setFavoriteIds(readStoredIds(FAVORITES_KEY))
      setCompareIds(readStoredIds(COMPARE_KEY))
      setBuyerIntent(readBuyerIntent())
      setSavedSearches(readSavedSearches())
    }
    syncSelection()
    return subscribeClientPreferences(syncSelection)
  }, [])

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      setPage(1)
      try {
        const data = await fetchProperties(1, controller.signal)
        setProprietati(data.properties || [])
        setTotal(Number(data.total || 0))
        setHasMore(Boolean(data.hasMore))
      } catch (err: any) {
        if (err?.name !== "AbortError") setError(err?.message || "Nu am putut incarca proprietatile. Incercam din nou in cateva momente.")
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query, sort, filtruTip, filtruZona, filtruCamere, pretMax, suprafataMin, doarFeatured])

  const filtered = useMemo(() => {
    return [...proprietati]
      .sort((a, b) => {
        if (sort === "match") return scoreProperty(b, buyerIntent).score - scoreProperty(a, buyerIntent).score
        if (sort === "priceAsc") return a.price - b.price
        if (sort === "priceDesc") return b.price - a.price
        if (sort === "areaDesc") return b.area_sqm - a.area_sqm
        return new Date(b.created_at || b.published_at).getTime() - new Date(a.created_at || a.published_at).getTime()
      })
  }, [proprietati, sort, buyerIntent])

  const scoredFiltered = useMemo(() => filtered.map((property) => ({ property, ...scoreProperty(property, buyerIntent) })), [filtered, buyerIntent])
  const featuredCount = proprietati.filter((p) => p.featured).length
  const activeFilters =
    query.trim() !== "" ||
    filtruTip !== "toate" ||
    filtruZona !== "Toate zonele" ||
    filtruCamere > 0 ||
    pretMax > 0 ||
    suprafataMin > 0 ||
    doarFeatured

  const resetFiltre = () => {
    setQuery("")
    setFiltruTip("toate")
    setFiltruZona("Toate zonele")
    setFiltruCamere(0)
    setPretMax(0)
    setSuprafataMin(0)
    setDoarFeatured(false)
    setSort("newest")
  }

  const fetchProperties = async (nextPage: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      q: query,
      sort,
      tip: filtruTip,
      zone: filtruZona,
      rooms: String(filtruCamere),
      maxPrice: String(pretMax),
      minArea: String(suprafataMin),
      featured: doarFeatured ? "1" : "0",
      page: String(nextPage),
      pageSize: String(initialPageSize),
    })
    const res = await fetch(`/api/properties/search?${params.toString()}`, { signal })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body?.error || "Cautarea proprietatilor a esuat.")
    return body as { properties: Property[]; total: number; hasMore: boolean }
  }

  const loadMore = async () => {
    const nextPage = page + 1
    setLoading(true)
    setError("")
    try {
      const data = await fetchProperties(nextPage)
      setProprietati((prev) => [...prev, ...(data.properties || [])])
      setTotal(Number(data.total || total))
      setHasMore(Boolean(data.hasMore))
      setPage(nextPage)
    } catch (err: any) {
      setError(err?.message || "Nu am putut incarca urmatoarea pagina.")
    } finally {
      setLoading(false)
    }
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
      pretMax > 0 ? `sub ${formatCurrency(pretMax)}` : null,
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
      results: total,
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
    setPretMax(Number(search.maxPrice) || 0)
    setSuprafataMin(search.minArea)
    setDoarFeatured(search.featuredOnly)
  }

  return (
    <section id="proprietati" className="bg-bg-primary px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">
              Proprietati verificate, gata de comparat.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-muted">
              Cauta dupa zona, buget si tip de locuinta. Salveaza shortlist-ul, compara trei variante si continua in portal cand decizia devine serioasa.
            </p>
          </div>

          <div className="grid grid-cols-3 border border-bg-surface bg-bg-card shadow-card sm:min-w-[420px]">
            <Stat value={proprietati.length} label="active" />
            <Stat value={featuredCount} label="selectate" />
            <Stat value={favoriteIds.length} label="favorite" />
          </div>
        </div>

        <div className="border border-bg-surface bg-bg-card p-4 shadow-card md:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_150px]">
            <label className="relative block">
              <span className="sr-only">Cauta proprietati</span>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  setQueryFocused(true)
                  if (suggestions.length) setSuggestOpen(true)
                }}
                onBlur={() => {
                  setQueryFocused(false)
                  setSuggestOpen(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSuggestOpen(false)
                }}
                className="h-12 w-full border border-bg-surface bg-bg-primary pl-11 pr-4 text-sm font-semibold text-text-primary placeholder:text-text-muted/70 focus:border-accent focus:outline-none"
                placeholder="Cauta dupa zona, adresa sau descriere"
              />
              {queryFocused && suggestOpen && suggestions.length > 0 && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-bg-surface bg-bg-primary shadow-card">
                  {suggestions.slice(0, 12).map((item) => (
                    <button
                      key={`${item.type}:${item.value}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        if (item.type === "zone") setFiltruZona(item.value)
                        else setQuery(item.value)
                        setSuggestOpen(false)
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-semibold text-text-primary transition hover:bg-bg-secondary"
                    >
                      <span className="min-w-0 truncate">{item.value}</span>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{item.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold text-text-primary focus:border-accent focus:outline-none">
              {Object.entries(SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={filtruZona} onChange={(e) => setFiltruZona(e.target.value)} className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold text-text-primary focus:border-accent focus:outline-none">
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
            <button
              onClick={() => setShowFiltre(!showFiltre)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition ${showFiltre ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-primary text-text-primary hover:border-accent hover:text-accent"}`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filtre
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {/* Chips camere — vizibile permanent, fara a deschide "Filtre" */}
            {[0, 1, 2, 3, 4].map((nr) => (
              <button
                key={`camere-${nr}`}
                onClick={() => setFiltruCamere(filtruCamere === nr ? 0 : nr)}
                className={`shrink-0 rounded-md border px-3.5 py-2 text-sm font-black transition ${filtruCamere === nr && nr > 0 ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-primary text-text-muted hover:border-accent hover:text-accent"}`}
                aria-pressed={filtruCamere === nr && nr > 0}
                title={nr === 0 ? "Orice numar de camere" : `Minim ${nr} ${nr === 1 ? "camera" : "camere"}`}
              >
                {nr === 0 ? "Orice" : nr === 4 ? "4+ cam" : `${nr} cam`}
              </button>
            ))}
            <span className="mx-1 border-l border-bg-surface" aria-hidden />
            {Object.entries(TIPURI).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFiltruTip(value)}
                className={`shrink-0 rounded-md border px-3.5 py-2 text-sm font-black transition ${filtruTip === value ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-primary text-text-muted hover:border-accent hover:text-accent"}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setDoarFeatured(!doarFeatured)}
              className={`shrink-0 rounded-md border px-3.5 py-2 text-sm font-black transition ${doarFeatured ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-primary text-text-muted hover:border-accent hover:text-accent"}`}
            >
              Selectate HQS
            </button>
          </div>

          {showFiltre && (
            <div className="mt-5 grid gap-5 border-t border-bg-surface pt-5 md:grid-cols-3">
              <Range label="Camere" value={filtruCamere === 0 ? "orice" : `${filtruCamere}+`} minLabel="Orice" maxLabel="6+" min={0} max={6} step={1} valueNumber={filtruCamere} onChange={setFiltruCamere} />
              <div>
                <Range label="Buget maxim" value={pretMax === 0 ? "fara limita" : formatCurrency(pretMax)} minLabel="EUR 50k" maxLabel="EUR 1M+" min={50000} max={PRICE_CEILING} step={10000} valueNumber={pretMax || PRICE_CEILING} onChange={setPretMax} />
                <button
                  type="button"
                  onClick={() => setPretMax(0)}
                  className={`mt-3 rounded-md border px-3 py-2 text-xs font-black transition ${pretMax === 0 ? "border-accent bg-accent text-bg-primary" : "border-bg-surface text-text-muted hover:border-accent hover:text-accent"}`}
                >
                  Fara limita
                </button>
              </div>
              <Range label="Suprafata minima" value={suprafataMin === 0 ? "orice" : `${suprafataMin} mp`} minLabel="Orice" maxLabel="300 mp" min={0} max={300} step={10} valueNumber={suprafataMin} onChange={setSuprafataMin} />
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr_auto]">
          <div className="border border-bg-surface bg-bg-card p-5 shadow-card">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
              <Target className="h-4 w-4 text-accent" aria-hidden />
              Profil cumparator
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <span className="bg-bg-secondary px-3 py-2 text-text-muted">{formatCurrency(buyerIntent.budget)}</span>
              <span className="bg-bg-secondary px-3 py-2 text-text-muted">{buyerIntent.area === "orice" ? "orice zona" : buyerIntent.area}</span>
              <span className="bg-bg-secondary px-3 py-2 text-text-muted">{buyerIntent.rooms}+ camere</span>
            </div>
            <button onClick={applyBuyerIntent} className="mt-4 w-full rounded-md border border-accent/40 px-4 py-2.5 text-sm font-black text-accent hover:bg-accent hover:text-bg-primary">
              Aplica profilul
            </button>
          </div>

          <div className="border border-bg-surface bg-bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                <BookmarkPlus className="h-4 w-4 text-accent" aria-hidden />
                Cautari salvate
              </p>
              <button onClick={saveSearch} className="text-sm font-black text-accent">Salveaza</button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {savedSearches.length ? savedSearches.map((search) => (
                <button key={search.id} onClick={() => applySavedSearch(search)} className="shrink-0 border border-bg-surface bg-bg-secondary px-3 py-2 text-left text-xs text-text-muted hover:border-accent hover:text-accent">
                  <span className="block max-w-[220px] truncate font-black text-text-primary">{search.label}</span>
                  <span>{search.results} rezultate</span>
                </button>
              )) : <p className="text-sm leading-6 text-text-muted">Salveaza o combinatie de filtre pentru urmatoarea cautare.</p>}
            </div>
          </div>

          <div className="grid min-w-[210px] grid-cols-2 border border-bg-surface bg-bg-card shadow-card lg:grid-cols-1">
            <SelectionLink href="/favorite" icon={<Heart className="h-4 w-4" aria-hidden />} value={favoriteIds.length} label="favorite" onClear={() => clearStoredIds(FAVORITES_KEY)} />
            <SelectionLink href="/comparare" icon={<Target className="h-4 w-4" aria-hidden />} value={compareIds.length} label="comparare" onClear={() => clearStoredIds(COMPARE_KEY)} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-text-muted">
            {loading && !proprietati.length ? "Se incarca proprietatile..." : `${total} ${total === 1 ? "rezultat gasit" : "rezultate gasite"}`}
          </p>
          {activeFilters && (
            <button onClick={resetFiltre} className="inline-flex items-center gap-2 text-sm font-black text-accent hover:text-text-primary">
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reseteaza cautarea
            </button>
          )}
        </div>

        {error && <div className="mt-5 border border-red-500/30 bg-red-500/10 p-4 text-sm text-text-primary">{error}</div>}

        {loading && !proprietati.length ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-96 animate-pulse border border-bg-surface bg-bg-card" />)}
          </div>
        ) : scoredFiltered.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scoredFiltered.map(({ property, score, reasons }, index) => <ProprietateCard key={property.id} proprietate={property} matchScore={score} matchReasons={reasons} priorityImage={index === 0} />)}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button onClick={loadMore} disabled={loading} className="rounded-md border border-accent px-6 py-3 text-sm font-black text-accent transition hover:bg-accent hover:text-bg-primary disabled:cursor-wait disabled:opacity-60">
                  {loading ? "Se incarca..." : "Incarca mai multe"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 border border-bg-surface bg-bg-card px-6 py-16 text-center shadow-card">
            <h3 className="text-xl font-black text-text-primary">Nu am gasit o potrivire exacta.</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-muted">
              Spune-ne ce cauti si putem verifica oferte care nu sunt inca publicate sau proprietati aflate in pregatire.
            </p>
            <button onClick={resetFiltre} className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-black text-bg-primary">Reseteaza filtrele</button>
          </div>
        )}
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-bg-surface p-4 text-center last:border-r-0">
      <div className="text-2xl font-black text-accent">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{label}</div>
    </div>
  )
}

function Range({
  label,
  value,
  minLabel,
  maxLabel,
  min,
  max,
  step,
  valueNumber,
  onChange,
}: {
  label: string
  value: string
  minLabel: string
  maxLabel: string
  min: number
  max: number
  step: number
  valueNumber: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
        {label}: <span className="text-accent">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={valueNumber} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
      <span className="mt-1 flex justify-between text-xs text-text-muted"><span>{minLabel}</span><span>{maxLabel}</span></span>
    </label>
  )
}

function SelectionLink({ href, icon, value, label, onClear }: { href: string; icon: ReactNode; value: number; label: string; onClear: () => void }) {
  return (
    <div className="border-b border-bg-surface p-4 last:border-b-0">
      <Link href={href} className="flex items-center justify-between gap-4 text-text-primary hover:text-accent">
        <span className="flex items-center gap-2 text-sm font-black">{icon}{label}</span>
        <span className="text-xl font-black text-accent">{value}</span>
      </Link>
      {value > 0 && <button onClick={onClear} className="mt-2 text-xs font-black text-text-muted hover:text-accent">Goleste</button>}
    </div>
  )
}
