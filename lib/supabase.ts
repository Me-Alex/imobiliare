import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Public Supabase values use static property reads so Next can inline them into
// client bundles. Dynamic process.env[key] reads stay undefined in the browser.
const fallbackSupabaseUrl = 'https://spmapzhlcwhzfrxuvgxd.supabase.co'
const fallbackSupabaseAnonKey = 'sb_publishable_24oJXCI0JLY1VyLq_Ls-AA_-tYFf729'

export const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl
export const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey

function cloudflareEnv(key: string) {
  const contextKey = Symbol.for('__cloudflare-request-context__')
  const context = (globalThis as typeof globalThis & Record<symbol, { env?: Record<string, string | undefined> } | undefined>)[contextKey]
  return context?.env?.[key]
}

function getEnv(key: string): string {
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') return supabaseUrl
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return supabaseAnonKey

  const val = cloudflareEnv(key)
    || (typeof process !== 'undefined' ? process.env[key] : undefined)
    || (typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>)[key] as string : undefined)
  if (!val) {
    throw new Error(
      `[HQS] Variabila de mediu ${key} este obligatorie.\n` +
      'Seteaz-o in Cloudflare Pages -> Settings -> Environment Variables.'
    )
  }
  return val
}

export function getSupabaseUrl(): string {
  return getEnv('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

let _client: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _client
}

// Lazy proxy keeps the existing `supabase.from(...)` call sites working while
// avoiding client creation during module evaluation.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop: string | symbol) {
    const client = getSupabaseClient()
    const val = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof val === 'function') return val.bind(client)
    return val
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
