import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'
import type { VirtualTour, VirtualTourHotspot, VirtualTourScene } from '@/lib/virtual-tours'

interface RawHotspot {
  id: string
  label: string
  yaw: number
  pitch: number
  target_scene_id: string
}

interface RawScene {
  id: string
  title: string
  image_url: string | null
  storage_bucket: 'virtual-tour-drafts' | 'virtual-tours'
  storage_path: string
  sort_order: number
  initial_yaw: number
  initial_pitch: number
  initial_fov: number
  virtual_tour_hotspots?: RawHotspot[] | null
}

interface RawTour {
  id: string
  provider: VirtualTour['provider']
  status: VirtualTour['status']
  title: string
  external_url: string | null
  entry_scene_id: string | null
  virtual_tour_scenes?: RawScene[] | null
}

interface RawProperty {
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
  year_built: number | null
  address: string | null
  zone: string | null
  sector: string | null
  city: string
  lat: number | null
  lng: number | null
  status: string
  featured: boolean | null
  cover_image_url: string | null
  gallery_urls: string[] | null
  created_at: string | null
  updated_at: string | null
  virtual_tours?: RawTour[] | RawTour | null
}

const PROPERTY_SELECT = `
  id,title,slug,description,type,transaction_type,price,currency,area_sqm,rooms,bathrooms,
  floor,year_built,address,zone,sector,city,lat,lng,status,featured,cover_image_url,gallery_urls,
  created_at,updated_at,
  virtual_tours(
    id,provider,status,title,external_url,entry_scene_id,
    virtual_tour_scenes!virtual_tour_scenes_tour_id_fkey(
      id,title,image_url,storage_bucket,storage_path,sort_order,initial_yaw,initial_pitch,initial_fov,
      virtual_tour_hotspots!virtual_tour_hotspots_scene_id_fkey(id,label,yaw,pitch,target_scene_id)
    )
  )
`

function firstTour(value: RawProperty['virtual_tours']): RawTour | null {
  if (Array.isArray(value)) return value.find((tour) => tour.status === 'PUBLISHED') || null
  return value?.status === 'PUBLISHED' ? value : null
}

function normalizeHotspot(row: RawHotspot): VirtualTourHotspot {
  return {
    id: row.id,
    label: row.label,
    yaw: Number(row.yaw),
    pitch: Number(row.pitch),
    targetSceneId: row.target_scene_id,
  }
}

function normalizeScene(row: RawScene): VirtualTourScene | null {
  if (!row.image_url) return null
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    sortOrder: Number(row.sort_order),
    initialYaw: Number(row.initial_yaw),
    initialPitch: Number(row.initial_pitch),
    initialFov: Number(row.initial_fov),
    hotspots: (row.virtual_tour_hotspots || []).map(normalizeHotspot),
  }
}

function normalizeTour(row: RawTour | null): VirtualTour | null {
  if (!row) return null
  const scenes = (row.virtual_tour_scenes || [])
    .map(normalizeScene)
    .filter((scene): scene is VirtualTourScene => scene !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (row.provider === 'NATIVE' && scenes.length === 0) return null
  if (row.provider !== 'NATIVE' && !row.external_url) return null
  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    title: row.title,
    externalUrl: row.external_url,
    entrySceneId: row.entry_scene_id,
    scenes,
  }
}

function normalizeProperty(row: RawProperty): Property {
  const price = Number(row.price) || 0
  const areaSqm = Number(row.area_sqm) || 0
  const now = new Date().toISOString()
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    type: row.type,
    transaction: row.transaction_type || 'SALE',
    price,
    currency: row.currency || 'EUR',
    areaSqm,
    rooms: row.rooms || 0,
    bathrooms: row.bathrooms || 0,
    floor: row.floor,
    yearBuilt: row.year_built,
    address: row.address || row.zone || row.city,
    zone: row.zone || row.city,
    sector: row.sector,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    featured: Boolean(row.featured),
    coverUrl: row.cover_image_url,
    galleryUrls: JSON.stringify(row.gallery_urls || []),
    pricePerSqm: areaSqm > 0 ? Math.round(price / areaSqm) : null,
    virtualTour: normalizeTour(firstTour(row.virtual_tours)),
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || row.created_at || now,
  }
}

export async function getPublishedSupabaseProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) {
    console.warn('Supabase properties unavailable:', error.message)
    return []
  }
  return ((data || []) as unknown as RawProperty[]).map(normalizeProperty)
}

export async function getPublishedSupabasePropertyBySlug(slug: string): Promise<Property | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle()
  if (error) {
    console.warn('Supabase property unavailable:', error.message)
    return null
  }
  return data ? normalizeProperty(data as unknown as RawProperty) : null
}
