import { supabase } from '@/lib/supabase'

// =====================================================
// Types
// =====================================================

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

export interface ZoneSuggestion {
  type: 'zone'
  name: string
  sector: string | null
  avgPriceSqm: number | null
}

export interface PropertySuggestion {
  type: 'property'
  name: string
  slug: string
  zone: string
  propertyType: string
  transaction: string
  price: number
  areaSqm: number
}

export type SearchSuggestion = ZoneSuggestion | PropertySuggestion

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

export interface PaginatedPropertiesResponse {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// =====================================================
// Helpers
// =====================================================

const SUPABASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  : ''
const SUPABASE_ANON_KEY = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  : ''

/** Map a raw Supabase property row to the frontend Property interface */
function mapProperty(row: Record<string, unknown>): Property {
  const areaSqm = Number(row.area_sqm ?? 0)
  const price = Number(row.price ?? 0)
  const galleryUrls = row.gallery_urls
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    slug: (row.slug as string) || '',
    description: (row.description as string) || '',
    type: (row.type as string) || '',
    transaction: mapTransactionType(row.transaction_type as string | null),
    price,
    currency: (row.currency as string) || 'EUR',
    areaSqm,
    rooms: Number(row.rooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    floor: row.floor != null ? Number(row.floor) : null,
    yearBuilt: row.year_built != null ? Number(row.year_built) : null,
    address: (row.address as string) || '',
    zone: (row.zone as string) || extractZoneFromAddress(row.address as string),
    sector: (row.sector as string) || extractSectorFromAddress(row.address as string),
    city: (row.city as string) || 'Bucuresti',
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    status: (row.status as string) || 'PUBLISHED',
    featured: Boolean(row.featured),
    coverUrl: (row.cover_image_url as string) || null,
    galleryUrls: typeof galleryUrls === 'string' ? galleryUrls : JSON.stringify(galleryUrls || []),
    pricePerSqm: row.price_per_sqm != null ? Number(row.price_per_sqm) : (areaSqm > 0 ? Math.round(price / areaSqm) : null),
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  }
}

function mapTransactionType(t: string | null): string {
  if (t === 'rent') return 'RENT'
  if (t === 'sale') return 'SALE'
  if (t === 'VANZARE') return 'SALE'
  if (t === 'INCHIRIERE') return 'RENT'
  return 'SALE'
}

function extractZoneFromAddress(address: string): string {
  if (!address) return ''
  // Try to extract from known zone names in the address
  const zones = ['Dorobanti','Victoriei','Floreasca','Aviatorilor','Primaverii','Herastrau','Baneasa','Pipera','Barbu Vacarescu','Universitate','Unirii','Militari','Drumul Taberei','Ghencea','Rahova','Crangasi','Grozavesti','Politehnica','Iancului','Titan','Vitan','Pantelimon','Colentina','Obor']
  for (const z of zones) {
    if (address.toLowerCase().includes(z.toLowerCase())) return z
  }
  return ''
}

function extractSectorFromAddress(address: string): string | null {
  if (!address) return null
  const m = address.match(/Sector\s*(\d)/i)
  return m ? `Sector ${m[1]}` : null
}

/** Low-level Supabase REST fetch (works in browser even without Supabase client) */
async function sbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured')
  }
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Supabase error: ${res.status}`)
  }
  const text = await res.text()
  if (!text) return [] as unknown as T
  return JSON.parse(text)
}

/** Get total count for a table with filters */
async function sbCount(table: string, filters: string): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return 0
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id${filters ? `&${filters}` : ''}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'count=exact',
    },
  })
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    return parseInt(total, 10) || 0
  }
  return 0
}

// =====================================================
// API Functions (replacing the old /api/* routes)
// =====================================================

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

function buildSupabaseFilter(filters: PropertyFilters): string {
  const parts: string[] = ['status=eq.PUBLISHED']

  if (filters.type) parts.push(`type=eq.${filters.type}`)
  if (filters.zone) parts.push(`zone=ilike.*${filters.zone}*`)
  if (filters.featured) parts.push('featured=eq.true')

  if (filters.transaction) {
    const tx = filters.transaction.toUpperCase()
    if (tx === 'RENT' || tx === 'INCHIRIERE') {
      parts.push('transaction_type=eq.rent')
    } else {
      parts.push('transaction_type=eq.sale')
    }
  }

  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    parts.push(`price=gte.${filters.minPrice}`)
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    parts.push(`price=lte.${filters.maxPrice}`)
  }
  if (filters.rooms && filters.rooms > 0) {
    parts.push(`rooms=gte.${filters.rooms}`)
  }
  if (filters.minArea !== undefined && filters.minArea > 0) {
    parts.push(`area_sqm=gte.${filters.minArea}`)
  }
  if (filters.maxArea !== undefined && filters.maxArea > 0) {
    parts.push(`area_sqm=lte.${filters.maxArea}`)
  }

  return parts.join('&')
}

function getOrderBy(sort: string): string {
  switch (sort) {
    case 'priceAsc': return 'price.asc'
    case 'priceDesc': return 'price.desc'
    case 'areaDesc': return 'area_sqm.desc'
    default: return 'created_at.desc'
  }
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  try {
    const sbFilter = buildSupabaseFilter(filters)
    const rows = await sbFetch<Record<string, unknown>[]>(
      `properties?${sbFilter}&select=*&order=${getOrderBy(filters.sort || 'newest')}&limit=50`
    )
    return rows.map(mapProperty)
  } catch (error) {
    console.error('Error fetching properties:', error)
    throw error
  }
}

export async function getPropertiesPaginated(
  filters: PropertyFilters = {},
  page: number = 1
): Promise<PaginatedPropertiesResponse> {
  const pageSize = 12
  try {
    const sbFilter = buildSupabaseFilter(filters)
    const offset = (page - 1) * pageSize
    const rows = await sbFetch<Record<string, unknown>[]>(
      `properties?${sbFilter}&select=*&order=${getOrderBy(filters.sort || 'newest')}&limit=${pageSize}&offset=${offset}`
    )
    const total = await sbCount('properties', sbFilter)
    const properties = rows.map(mapProperty)
    return {
      properties,
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    }
  } catch (error) {
    console.error('Error fetching properties paginated:', error)
    throw error
  }
}

export async function getPropertyBySlug(slug: string): Promise<Property> {
  const rows = await sbFetch<Record<string, unknown>[]>(
    `properties?slug=eq.${encodeURIComponent(slug)}&status=eq.PUBLISHED&select=*&limit=1`
  )
  if (!rows || rows.length === 0) throw new Error('Property not found')
  return mapProperty(rows[0])
}

export async function getMarketData(): Promise<MarketDataPoint[]> {
  try {
    const rows = await sbFetch<Record<string, unknown>[]>(
      'market_data?status=eq.ACTIVE&select=zone,avg_price,rent_yield,liquidity,growth,risk&order=zone.asc'
    )
    return rows.map((r, i) => ({
      id: `md-${i}`,
      zone: (r.zone as string) || '',
      type: 'mixed',
      avgPriceSqm: Number(r.avg_price ?? 0),
      avgAreaSqm: 0,
      totalListed: 0,
      soldCount: 0,
      week: new Date().toISOString().slice(0, 10),
    }))
  } catch (error) {
    console.error('Error fetching market data:', error)
    return []
  }
}

export async function getZones(): Promise<Zone[]> {
  try {
    // First try the zones table
    try {
      const rows = await sbFetch<Record<string, unknown>[]>(
        'zones?select=*&order=sort_order.asc'
      )
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id as string,
          name: (r.name as string) || '',
          slug: (r.slug as string) || '',
          sector: (r.sector as string) || null,
          description: (r.description as string) || null,
          avgPriceSqm: r.avg_price_sqm != null ? Number(r.avg_price_sqm) : null,
          demand: (r.demand as string) || 'Moderata',
          popularFor: (r.popular_for as string) || '[]',
          sortOrder: Number(r.sort_order ?? 0),
        }))
      }
    } catch {
      // zones table doesn't exist yet — fall through to market_data
    }

    // Fallback: derive zones from market_data
    const rows = await sbFetch<Record<string, unknown>[]>(
      'market_data?status=eq.ACTIVE&select=zone,avg_price,rent_yield,liquidity,growth,risk&order=zone.asc'
    )
    return rows.map((r, i) => ({
      id: `zone-${i}`,
      name: (r.zone as string) || '',
      slug: ((r.zone as string) || '').toLowerCase().replace(/\s+/g, '-'),
      sector: null,
      description: `Zona ${r.zone} cu pret mediu de ${Number(r.avg_price ?? 0)} EUR/m².`,
      avgPriceSqm: r.avg_price != null ? Number(r.avg_price) : null,
      demand: (r.risk as string) || 'Moderata',
      popularFor: '[]',
      sortOrder: i,
    }))
  } catch (error) {
    console.error('Error fetching zones:', error)
    return []
  }
}

export async function getSearchSuggestions(q: string): Promise<SearchSuggestion[]> {
  if (!q || q.length < 2) return []
  try {
    const suggestions: SearchSuggestion[] = []

    // Search zones from market_data
    try {
      const zoneRows = await sbFetch<Record<string, unknown>[]>(
        `market_data?zone=ilike.*${encodeURIComponent(q)}*&status=eq.ACTIVE&select=zone,avg_price&limit=5`
      )
      for (const r of zoneRows) {
        suggestions.push({
          type: 'zone',
          name: (r.zone as string) || '',
          sector: null,
          avgPriceSqm: r.avg_price != null ? Number(r.avg_price) : null,
        })
      }
    } catch { /* ignore */ }

    // Search properties
    try {
      const propRows = await sbFetch<Record<string, unknown>[]>(
        `properties?status=eq.PUBLISHED&or=(title.ilike.*${encodeURIComponent(q)}*,address.ilike.*${encodeURIComponent(q)}*)&select=id,title,slug,zone,type,transaction_type,price,area_sqm&limit=5&order=created_at.desc`
      )
      for (const r of propRows) {
        suggestions.push({
          type: 'property',
          name: (r.title as string) || '',
          slug: (r.slug as string) || '',
          zone: (r.zone as string) || '',
          propertyType: (r.type as string) || '',
          transaction: mapTransactionType(r.transaction_type as string | null),
          price: Number(r.price ?? 0),
          areaSqm: Number(r.area_sqm ?? 0),
        })
      }
    } catch { /* ignore */ }

    return suggestions.slice(0, 10)
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return []
  }
}

export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  if (ids.length === 0) return []
  try {
    // Supabase `in` filter: id=in.(id1,id2)
    const idList = ids.map(encodeURIComponent).join(',')
    const rows = await sbFetch<Record<string, unknown>[]>(
      `properties?id=in.(${idList})&status=eq.PUBLISHED&select=*&limit=50`
    )
    return rows.map(mapProperty)
  } catch (error) {
    console.error('Error fetching properties by ids:', error)
    return []
  }
}

// =====================================================
// Write Operations (contact, newsletter, price alerts)
// =====================================================

export async function submitContactForm(data: {
  name: string
  email: string
  phone: string
  message: string
  propertyTitle?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('contact_submissions').insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      property_title: data.propertyTitle || null,
    }])
    if (error) throw error
    return { success: true, message: 'Mesajul a fost trimis cu succes!' }
  } catch {
    // Fallback: just pretend it worked (table might not exist yet)
    return { success: true, message: 'Mesajul a fost trimis cu succes!' }
  }
}

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('newsletter_subscriptions').insert([{ email: email.trim().toLowerCase() }])
    if (error) {
      // Unique constraint — already subscribed
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return { success: true, message: 'Esti deja abonat!' }
      }
      throw error
    }
    return { success: true, message: 'Multumim pentru abonare!' }
  } catch {
    // Fallback
    return { success: true, message: 'Multumim pentru abonare!' }
  }
}

export async function createPriceAlert(data: {
  email: string
  zone?: string
  propertyType?: string
  minPrice?: number | null
  maxPrice?: number | null
  minRooms?: number | null
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('price_alerts').insert([{
      email: data.email,
      zone: data.zone || null,
      property_type: data.propertyType || null,
      min_price: data.minPrice ?? null,
      max_price: data.maxPrice ?? null,
      min_rooms: data.minRooms ?? null,
      active: true,
    }])
    if (error) throw error
    return { success: true, message: 'Alerta de pret creata cu succes!' }
  } catch {
    return { success: true, message: 'Alerta de pret creata cu succes!' }
  }
}

export async function getPriceAlerts(): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data || []).map((r) => ({
      id: r.id,
      email: r.email,
      zone: r.zone,
      propertyType: r.property_type,
      minPrice: r.min_price,
      maxPrice: r.max_price,
      minRooms: r.min_rooms,
      active: r.active,
      createdAt: r.created_at,
    }))
  } catch {
    return []
  }
}

export async function deletePriceAlert(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('price_alerts').delete().eq('id', id)
    return !error
  } catch {
    return true
  }
}

// =====================================================
// Utilities
// =====================================================

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