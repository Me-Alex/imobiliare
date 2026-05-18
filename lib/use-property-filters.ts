"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Property } from "@/lib/supabase"
import { scoreProperty } from "@/lib/experience"
import {
  COMPARE_KEY,
  DEFAULT_BUYER_INTENT,
  FAVORITES_KEY,
  readBuyerIntent,
  readSavedSearches,
  readStoredIds,
  subscribeClientPreferences,
  writeSavedSearches,
  type BuyerIntent,
  type SavedSearch,
} from "@/lib/client-preferences"
import { formatCurrency } from "@/lib/format"

export const PRICE_CEILING = 1_000_000

export type SortKey = "newest" | "match" | "priceAsc" | "priceDesc" | "areaDesc"

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Cele mai noi",
  match: "Potrivire profil",
  priceAsc: "Pret crescator",
  priceDesc: "Pret descrescator",
  areaDesc: "Suprafata mare",
}

export const TIPURI: Record<string, string> = {
  toate: "Toate",
  APARTMENT: "Apartamente",
  HOUSE: "Case",
  VILLA: "Vile",
  LAND: "Terenuri",
  COMMERCIAL: "Comercial",
}

export const DEFAULT_ZONES = ["Bucuresti", "Floreasca", "Baneasa", "Pipera", "Dorobanti", "Aviatorilor", "Corbeanca"]

interface UsePropertyFiltersProps {
  initialProperties: Property[]
  initialTotal: number
  initialHasMore: boolean
  initialPageSize: number
  initialQuery: string
  initialZone: string
  initialType: string
  initialBudget?: number
  initialRooms: number
  initialMinArea: number
  initialFeaturedOnly: boolean
  initialSort: SortKey
  initialZones: string[]
}

/**
 * Hook care centralizeaza toata logica de filtrare, sortare, paginare
 * si stare locala din ProprietatiSection.
 * Componenta ramane responsabila doar pentru UI.
 */
export function usePropertyFilters({
  initialProperties,
  initialTotal,
  initialHasMore,
  initialPageSize,
  initialQuery,
  initialZone,
  initialType,
  initialBudget,
  initialRooms,
  initialMinArea,
  initialFeaturedOnly,
  initialSort,
  initialZones,
}: UsePropertyFiltersProps) {
  const [proprietati, setProprietati] = useState<Property[]>(initialProperties)
  const [loading, setLoading] = useState(initialProperties.length === 0)
  const [error, setError] = useState("")
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>(initialSort)
  const [filtruTip, setFiltruTip] = useState(TIPURI[initialType] ? initialType : "toate")
  const [zones, setZones] = useState(() =>
    ["Toate zonele", ...Array.from(new Set([initialZone, ...(initialZones || []), ...DEFAULT_ZONES])).filter((z) => z && z !== "Toate zonele")]
  )
  const [filtruZona, setFiltruZona] = useState(initialZone || "Toate zonele")
  const [filtruCamere, setFiltruCamere] = useState(initialRooms)
  const [pretMax, setPretMax] = useState(initialBudget || 0)
  const [suprafataMin, setSuprafataMin] = useState(initialMinArea)
  const [doarFeatured, setDoarFeatured] = useState(initialFeaturedOnly)
  const [showFiltre, setShowFiltre] = useState(false)

  const [buyerIntent, setBuyerIntent] = useState<BuyerIntent>(DEFAULT_BUYER_INTENT)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchRef = useRef(0)

  // Sincronizare stare locala (favorites, compare, buyer intent)
  useEffect(() => {
    const sync = () => {
      setBuyerIntent(readBuyerIntent())
      setSavedSearches(readSavedSearches())
      setFavoriteIds(readStoredIds(FAVORITES_KEY))
      setCompareIds(readStoredIds(COMPARE_KEY))
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [])

  // Fetch sugestii zone din API
  useEffect(() => {
    if (!query.trim()) return
    const ctrl = new AbortController()
    fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=zone`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((body) => {
        const next = (body.suggestions || [])
          .filter((s: { type: string }) => s.type === "zone")
          .map((s: { value: unknown }) => String(s.value))
          .filter(Boolean)
        if (next.length) setZones(["Toate zonele", ...Array.from(new Set([...next, ...DEFAULT_ZONES]))])
      })
      .catch(() => null)
    return () => ctrl.abort()
  }, [query])

  // Fetch proprietati cu debounce
  const doFetch = useCallback(
    (reset: boolean, pageNum: number) => {
      const id = ++fetchRef.current
      setLoading(true)
      setError("")
      const params = new URLSearchParams({
        q: query,
        zone: filtruZona,
        type: filtruTip,
        rooms: String(filtruCamere),
        maxPrice: String(pretMax),
        minArea: String(suprafataMin),
        featured: doarFeatured ? "1" : "0",
        sort,
        page: String(pageNum),
        pageSize: String(initialPageSize),
      })
      fetch(`/api/properties/search?${params}`)
        .then((r) => r.json())
        .then((body) => {
          if (fetchRef.current !== id) return
          const next: Property[] = body.properties || []
          setProprietati((prev) => (reset ? next : [...prev, ...next]))
          setTotal(body.total || 0)
          setHasMore(body.hasMore || false)
          setPage(pageNum)
        })
        .catch(() => {
          if (fetchRef.current !== id) return
          setError("Nu am putut incarca proprietatile. Incearca din nou.")
        })
        .finally(() => {
          if (fetchRef.current !== id) return
          setLoading(false)
        })
    },
    [query, sort, filtruTip, filtruZona, filtruCamere, pretMax, suprafataMin, doarFeatured, initialPageSize]
  )

  // Re-fetch la schimbarea oricarui filtru
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doFetch(true, 1), 340)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [doFetch])

  const loadMore = useCallback(() => doFetch(false, page + 1), [doFetch, page])

  // Scoring local pentru sortare "match"
  const scoredFiltered = useMemo(() => {
    return proprietati
      .map((p) => ({ property: p, ...scoreProperty(p, buyerIntent) }))
      .sort((a, b) => {
        if (sort === "match") return b.score - a.score
        if (sort === "priceAsc") return a.property.price - b.property.price
        if (sort === "priceDesc") return b.property.price - a.property.price
        if (sort === "areaDesc") return b.property.area_sqm - a.property.area_sqm
        return 0
      })
  }, [proprietati, sort, buyerIntent])

  const activeFilters =
    filtruTip !== "toate" ||
    filtruZona !== "Toate zonele" ||
    filtruCamere > 0 ||
    pretMax > 0 ||
    suprafataMin > 0 ||
    doarFeatured ||
    !!query.trim()

  const resetFiltre = useCallback(() => {
    setQuery("")
    setFiltruTip("toate")
    setFiltruZona("Toate zonele")
    setFiltruCamere(0)
    setPretMax(0)
    setSuprafataMin(0)
    setDoarFeatured(false)
    setSort("newest")
  }, [])

  const applyBuyerIntent = useCallback(() => {
    setFiltruCamere(buyerIntent.rooms)
    if (buyerIntent.area !== "orice") setFiltruZona(buyerIntent.area)
    if (buyerIntent.budget > 0) setPretMax(buyerIntent.budget)
  }, [buyerIntent])

  const saveSearch = useCallback(() => {
    const parts = [
      query.trim() || TIPURI[filtruTip] || "Portofoliu",
      filtruZona !== "Toate zonele" ? filtruZona : null,
      filtruCamere > 0 ? `${filtruCamere}+ camere` : null,
      pretMax > 0 ? `max ${formatCurrency(pretMax)}` : null,
    ].filter(Boolean)
    const label = parts.join(", ")
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      label,
      type: filtruTip,
      zone: filtruZona,
      rooms: filtruCamere,
      budget: pretMax,
      minArea: suprafataMin,
      featuredOnly: doarFeatured,
      results: total,
      savedAt: new Date().toISOString(),
    }
    const next = [newSearch, ...savedSearches.slice(0, 4)]
    writeSavedSearches(next)
    setSavedSearches(next)
  }, [query, filtruTip, filtruZona, filtruCamere, pretMax, suprafataMin, doarFeatured, total, savedSearches])

  const applySavedSearch = useCallback((search: SavedSearch) => {
    setFiltruTip(search.type)
    setFiltruZona(search.zone)
    setFiltruCamere(search.rooms)
    setPretMax(search.budget)
    setSuprafataMin(search.minArea)
    setDoarFeatured(search.featuredOnly)
  }, [])

  const featuredCount = proprietati.filter((p) => p.featured).length

  return {
    // state
    proprietati, loading, error, total, hasMore, page,
    query, setQuery,
    sort, setSort,
    filtruTip, setFiltruTip,
    zones, filtruZona, setFiltruZona,
    filtruCamere, setFiltruCamere,
    pretMax, setPretMax,
    suprafataMin, setSuprafataMin,
    doarFeatured, setDoarFeatured,
    showFiltre, setShowFiltre,
    buyerIntent, savedSearches,
    favoriteIds, compareIds,
    // derivate
    scoredFiltered, activeFilters, featuredCount,
    // actiuni
    loadMore, resetFiltre, applyBuyerIntent, saveSearch, applySavedSearch,
  }
}
