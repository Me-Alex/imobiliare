import { createClient } from '@supabase/supabase-js'

// Env vars sunt citite lazy (la runtime/request), nu la module load time.
// Cloudflare Pages evalueaza modulele la build — un throw top-level crapa build-ul
// daca variabilele nu sunt setate ca "Build environment variables" in dashboard.
// Cu lazy getters, validarea are loc doar cand modulul e efectiv folosit intr-un request.

function getEnv(key: string): string {
  // In Edge Runtime (Cloudflare), process.env e populat din Cloudflare env bindings
  const val = process.env[key]
  if (!val) {
    throw new Error(
      `[HQS] Variabila de mediu ${key} este obligatorie.\n` +
      'Seteaz-o in Cloudflare Pages → Settings → Environment Variables.'
    )
  }
  return val
}

// Lazy getters — evaluate doar la primul acces (in request handler, nu la build)
let _supabaseUrl: string | undefined
let _supabaseAnonKey: string | undefined

export function getSupabaseUrl(): string {
  if (!_supabaseUrl) _supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  return _supabaseUrl
}

export function getSupabaseAnonKey(): string {
  if (!_supabaseAnonKey) _supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return _supabaseAnonKey
}

// Compatibilitate backward — aceste exporturi sunt folosite in toata aplicatia.
// Functioneaza corect la runtime; la build (module evaluation) nu mai arunca eroare.
export const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Client singleton lazy — creat la primul import efectiv din request handler
let _supabase: ReturnType<typeof createClient> | undefined
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
    }
    return (_supabase as Record<string | symbol, unknown>)[prop]
  }
})

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'LAND' | 'COMMERCIAL'
export type PropertyStatus = 'PUBLISHED' | 'DRAFT' | 'SOLD' | 'RENTED'

export interface Property {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  type: PropertyType
  status: PropertyStatus
  city: string
  county: string
  address: string
  area_sqm: number
  rooms: number
  bathrooms: number
  parking_spots: number
  featured: boolean
  cover_image_url?: string | null
  gallery_urls?: string[] | null
  published_at: string
  created_at: string
}

export interface Lead {
  id?: string
  name: string
  email?: string
  phone: string
  message?: string
  status?: string
  source?: string
  property_id?: string
}
