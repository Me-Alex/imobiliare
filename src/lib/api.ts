export interface Property {
  id: string
  title: string
  slug: string
  description: string
  type: string
  transaction: string
  price: number
  currency: string
  areaSqm: number
  rooms: number
  bathrooms: number
  floor: number | null
  yearBuilt: number | null
  address: string
  zone: string
  sector: string | null
  city: string
  lat: number | null
  lng: number | null
  status: string
  featured: boolean
  coverUrl: string | null
  galleryUrls: string
  pricePerSqm: number | null
  createdAt: string
  updatedAt: string
}

export interface MarketDataPoint {
  id: string
  zone: string
  type: string
  avgPriceSqm: number
  avgAreaSqm: number
  totalListed: number
  soldCount: number
  week: string
}

export interface Zone {
  id: string
  name: string
  slug: string
  sector: string | null
  description: string | null
  avgPriceSqm: number | null
  demand: string
  popularFor: string
  sortOrder: number
  _count?: { properties: number }
}

export interface SearchSuggestion {
  title: string
  slug: string
  zone: string
  type: string
  price: number
}

export interface PropertyFilters {
  zone?: string
  type?: string
  transaction?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  featured?: boolean
  search?: string
  sort?: string
  minArea?: number
  maxArea?: number
}

const BASE = '/api'

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const params = new URLSearchParams()
  if (filters.zone) params.set('zone', filters.zone)
  if (filters.type) params.set('type', filters.type)
  if (filters.transaction) params.set('transaction', filters.transaction)
  if (filters.minPrice !== undefined && filters.minPrice > 0) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice))
  if (filters.rooms && filters.rooms > 0) params.set('rooms', String(filters.rooms))
  if (filters.featured) params.set('featured', 'true')
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.minArea !== undefined && filters.minArea > 0) params.set('minArea', String(filters.minArea))
  if (filters.maxArea !== undefined && filters.maxArea > 0) params.set('maxArea', String(filters.maxArea))
  const query = params.toString()
  const data = await fetchApi<{ properties: Property[] }>(`${BASE}/properties${query ? `?${query}` : ''}`)
  return data.properties
}

export async function getPropertyBySlug(slug: string): Promise<Property> {
  const data = await fetchApi<{ property: Property }>(`${BASE}/properties/${slug}`)
  return data.property
}

export async function getMarketData(): Promise<MarketDataPoint[]> {
  const data = await fetchApi<{ weeklyData: MarketDataPoint[] }>(`${BASE}/market-data`)
  return data.weeklyData
}

export async function getZones(): Promise<Zone[]> {
  const data = await fetchApi<{ zones: Zone[] }>(`${BASE}/zones`)
  return data.zones
}

export async function getSearchSuggestions(q: string): Promise<SearchSuggestion[]> {
  return fetchApi<SearchSuggestion[]>(`${BASE}/search/suggestions?q=${encodeURIComponent(q)}`)
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPricePerSqm(price: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + '/m²'
}