import { PUBLIC_PROPERTY_SELECT, supabase, type Property, type PropertyType } from "@/lib/supabase"

export const PROPERTY_SORTS = ["newest", "match", "priceAsc", "priceDesc", "areaDesc"] as const
export type PropertySort = typeof PROPERTY_SORTS[number]

export type PropertySearchFilters = {
  q: string
  zone: string
  type: string
  rooms: number
  maxPrice: number
  minArea: number
  featuredOnly: boolean
  sort: PropertySort
  page: number
  pageSize: number
}

export type PropertySearchResult = {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

const DEFAULT_FILTERS: PropertySearchFilters = {
  q: "",
  zone: "Toate zonele",
  type: "toate",
  rooms: 0,
  maxPrice: 0,
  minArea: 0,
  featuredOnly: false,
  sort: "newest",
  page: 1,
  pageSize: 12,
}

function first(value: string | string[] | undefined | null) {
  return Array.isArray(value) ? value[0] : value
}

function numberParam(value: string | string[] | undefined | null, fallback = 0) {
  const next = Number(first(value) || "")
  return Number.isFinite(next) && next > 0 ? next : fallback
}

function boolParam(value: string | string[] | undefined | null) {
  return ["1", "true", "yes", "da"].includes(String(first(value) || "").toLowerCase())
}

function sortParam(value: string | string[] | undefined | null): PropertySort {
  const next = first(value) || ""
  return PROPERTY_SORTS.includes(next as PropertySort) ? next as PropertySort : "newest"
}

export function propertyFiltersFromSearchParams(searchParams?: Record<string, string | string[] | undefined>): PropertySearchFilters {
  return {
    q: String(first(searchParams?.q) || "").trim().slice(0, 120),
    zone: String(first(searchParams?.zone) || first(searchParams?.zona) || "Toate zonele").trim() || "Toate zonele",
    type: String(first(searchParams?.tip) || first(searchParams?.type) || "toate").trim() || "toate",
    rooms: numberParam(searchParams?.rooms || searchParams?.camere),
    maxPrice: numberParam(searchParams?.budget || searchParams?.maxPrice || searchParams?.pretMax),
    minArea: numberParam(searchParams?.minArea || searchParams?.suprafataMin),
    featuredOnly: boolParam(searchParams?.featured || searchParams?.featuredOnly),
    sort: sortParam(searchParams?.sort),
    page: Math.max(1, Math.round(numberParam(searchParams?.page, 1))),
    pageSize: Math.min(48, Math.max(6, Math.round(numberParam(searchParams?.pageSize, DEFAULT_FILTERS.pageSize)))),
  }
}

export function propertyFiltersFromUrl(url: URL) {
  const input: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    input[key] = value
  })
  return propertyFiltersFromSearchParams(input)
}

function applySort(query: any, sort: PropertySort) {
  if (sort === "priceAsc") return query.order("price", { ascending: true }).order("created_at", { ascending: false })
  if (sort === "priceDesc") return query.order("price", { ascending: false }).order("created_at", { ascending: false })
  if (sort === "areaDesc") return query.order("area_sqm", { ascending: false }).order("created_at", { ascending: false })
  if (sort === "match") return query.order("featured", { ascending: false }).order("created_at", { ascending: false })
  return query.order("created_at", { ascending: false })
}

function normalizeTextSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s-]+/g, " ").replace(/\s+/g, " ").trim()
}

export async function searchPublishedProperties(filters: PropertySearchFilters): Promise<PropertySearchResult> {
  let query = supabase
    .from("properties")
    .select(PUBLIC_PROPERTY_SELECT, { count: "exact" })
    .eq("status", "PUBLISHED")

  if (filters.type !== "toate") query = query.eq("type", filters.type as PropertyType)
  if (filters.zone !== "Toate zonele") query = query.eq("city", filters.zone)
  if (filters.rooms > 0) query = query.gte("rooms", filters.rooms)
  if (filters.maxPrice > 0) query = query.lte("price", filters.maxPrice)
  if (filters.minArea > 0) query = query.gte("area_sqm", filters.minArea)
  if (filters.featuredOnly) query = query.eq("featured", true)

  const text = normalizeTextSearch(filters.q)
  if (text) query = query.textSearch("search_vector", text, { type: "websearch", config: "simple" })

  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1
  const { data, count, error } = await applySort(query, filters.sort).range(from, to)

  if (error) throw new Error(error.message)

  const total = count || 0
  return {
    properties: (data || []) as Property[],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    hasMore: from + (data?.length || 0) < total,
  }
}

export async function listPropertyFacets() {
  const { data } = await supabase
    .from("properties")
    .select("city,type")
    .eq("status", "PUBLISHED")
    .limit(1000)

  const rows = Array.isArray(data) ? data : []
  return {
    zones: Array.from(new Set(rows.map((row) => row.city).filter(Boolean))).sort(),
    types: Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort(),
  }
}
