import type {
  Property,
  MarketDataPoint,
  Zone,
  SearchSuggestion,
  PropertyFilters,
  PaginatedPropertiesResponse,
} from './types'

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
  const params = buildPropertyParams(filters)
  const query = params.toString()
  const data = await fetchApi<PaginatedPropertiesResponse>(`${BASE}/properties${query ? `?${query}` : ''}`)
  return data.properties
}

export async function getPropertiesPaginated(filters: PropertyFilters = {}, page: number = 1): Promise<PaginatedPropertiesResponse> {
  const params = buildPropertyParams(filters)
  params.set('page', String(page))
  params.set('pageSize', '12')
  const query = params.toString()
  return fetchApi<PaginatedPropertiesResponse>(`${BASE}/properties${query ? `?${query}` : ''}`)
}

function buildPropertyParams(filters: PropertyFilters): URLSearchParams {
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
  return params
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
  const data = await fetchApi<{ suggestions: SearchSuggestion[] }>(`${BASE}/search/suggestions?q=${encodeURIComponent(q)}`)
  return data.suggestions
}

export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  const data = await fetchApi<{ properties: Property[] }>(`${BASE}/properties/compare`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
  return data.properties
}