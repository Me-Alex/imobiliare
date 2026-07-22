'use client'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { loadFromLS, saveToLS } from '@/lib/storage'
import type { AccountRole } from '@/lib/account-roles'
import type { UserProperty } from '@/lib/types'
import { uploadListingImages } from '@/lib/virtual-tour-publishing'

const PROPERTY_CACHE_PREFIX = 'hqs_managed_property_snapshot'

const MANAGED_PROPERTY_SELECT = `
  id,title,slug,description,type,transaction_type,price,currency,area_sqm,rooms,bathrooms,
  floor,total_floors,year_built,address,zone,sector,city,lat,lng,status,featured,cover_image_url,
  gallery_urls,owner_id,agent_id,created_at,updated_at
`

interface ManagedPropertyRow {
  id: string
  title: string
  slug: string
  description: string | null
  type: string
  transaction_type: string | null
  price: number | string
  currency: string | null
  area_sqm: number | string | null
  rooms: number | null
  bathrooms: number | null
  floor: number | null
  total_floors: number | null
  year_built: number | null
  address: string | null
  zone: string | null
  sector: string | null
  city: string | null
  lat: number | null
  lng: number | null
  status: string
  featured: boolean | null
  cover_image_url: string | null
  gallery_urls: string[] | null
  owner_id: string | null
  agent_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ManagedPropertyUpdate {
  title: string
  description: string
  type: string
  transaction: string
  price: number
  currency: string
  areaSqm: number
  rooms: number
  bathrooms: number
  floor: number | null
  totalFloors: number | null
  yearBuilt: number | null
  address: string
  zone: string
  sector: string
  featured: boolean
  galleryUrls: string[]
}

function requireSupabaseConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error('Publicarea proprietatilor nu este configurata. Verifica setarile Supabase.')
  }
}

export function userPropertyCacheKey(userId: string): string {
  return `${PROPERTY_CACHE_PREFIX}:${userId}`
}

export function loadManagedPropertyCache(userId: string | null | undefined): UserProperty[] {
  if (!userId) return []
  const properties = loadFromLS<unknown>(userPropertyCacheKey(userId), [])
  return Array.isArray(properties) ? properties as UserProperty[] : []
}

export function saveManagedPropertyCache(userId: string, properties: UserProperty[]): void {
  saveToLS(userPropertyCacheKey(userId), properties)
}

export function toSupabasePropertyType(type: string): string {
  const normalized = type.toLocaleLowerCase('ro-RO')
  if (normalized.includes('teren')) return 'LAND'
  if (normalized.includes('birou')) return 'OFFICE'
  if (normalized.includes('comercial') || normalized.includes('depozit')) return 'COMMERCIAL'
  if (normalized.includes('vil') || normalized.includes('pensiune')) return 'VILLA'
  if (normalized.includes('cas')) return 'HOUSE'
  return 'APARTMENT'
}

function toFormPropertyType(type: string): string {
  switch (type) {
    case 'HOUSE': return 'Casa'
    case 'VILLA': return 'Vila'
    case 'LAND': return 'Teren'
    case 'COMMERCIAL': return 'Spatiu Comercial'
    case 'OFFICE': return 'Birou'
    default: return 'Apartament'
  }
}

export function toManagedUserProperty(value: unknown): UserProperty {
  const row = value as ManagedPropertyRow
  const price = Number(row.price) || 0
  const areaSqm = Number(row.area_sqm) || 0
  const galleryUrls = Array.isArray(row.gallery_urls) ? row.gallery_urls : []
  const coverUrl = row.cover_image_url || galleryUrls[0] || ''

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    type: toFormPropertyType(row.type),
    transaction: row.transaction_type || 'VANZARE',
    price,
    currency: row.currency || 'EUR',
    area_sqm: areaSqm,
    areaSqm,
    rooms: row.rooms || 0,
    bathrooms: row.bathrooms || 0,
    floor: row.floor,
    total_floors: row.total_floors,
    year_built: row.year_built,
    yearBuilt: row.year_built,
    address: row.address || '',
    zone: row.zone || '',
    sector: row.sector || '',
    city: row.city || '',
    lat: row.lat,
    lng: row.lng,
    featured: Boolean(row.featured),
    cover_url: coverUrl,
    coverUrl,
    gallery_urls: JSON.stringify(galleryUrls),
    galleryUrls,
    price_per_sqm: areaSqm > 0 ? Math.round(price / areaSqm) : null,
    status: row.status,
    owner_id: row.owner_id,
    agent_id: row.agent_id,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
  }
}

export async function fetchManagedProperties(params: {
  userId: string
  role: Extract<AccountRole, 'OWNER' | 'AGENT' | 'ADMIN'>
}): Promise<UserProperty[]> {
  requireSupabaseConfiguration()

  const query = supabase
    .from('properties')
    .select(MANAGED_PROPERTY_SELECT)
    .neq('status', 'ARCHIVED')
  const scopedQuery = params.role === 'ADMIN'
    ? query
    : query.eq(params.role === 'OWNER' ? 'owner_id' : 'agent_id', params.userId)
  const { data, error } = await scopedQuery
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  const properties = (data || []).map(toManagedUserProperty)
  saveManagedPropertyCache(params.userId, properties)
  return properties
}

export async function updateManagedProperty(params: {
  propertyId: string
  userId: string
  values: ManagedPropertyUpdate
}): Promise<UserProperty> {
  requireSupabaseConfiguration()

  const galleryUrls = params.values.galleryUrls.some((url) => url.startsWith('data:'))
    ? await uploadListingImages({
        userId: params.userId,
        propertyId: params.propertyId,
        urls: params.values.galleryUrls,
      })
    : params.values.galleryUrls

  const { data, error } = await supabase
    .from('properties')
    .update({
      title: params.values.title,
      description: params.values.description,
      type: toSupabasePropertyType(params.values.type),
      transaction_type: params.values.transaction,
      price: params.values.price,
      currency: params.values.currency,
      area_sqm: params.values.areaSqm,
      rooms: params.values.rooms,
      bathrooms: params.values.bathrooms,
      floor: params.values.floor,
      total_floors: params.values.totalFloors,
      year_built: params.values.yearBuilt,
      address: params.values.address,
      zone: params.values.zone,
      sector: params.values.sector,
      featured: params.values.featured,
      cover_image_url: galleryUrls[0] || null,
      gallery_urls: galleryUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.propertyId)
    .select(MANAGED_PROPERTY_SELECT)
    .single()

  if (error || !data) throw new Error(error?.message || 'Proprietatea nu a putut fi actualizata.')
  return toManagedUserProperty(data)
}

export async function archiveManagedProperty(propertyId: string): Promise<void> {
  requireSupabaseConfiguration()

  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
    .eq('id', propertyId)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Proprietatea nu a fost gasita sau nu poate fi arhivata.')
}
