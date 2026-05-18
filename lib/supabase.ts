import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Env vars citite lazy (la runtime/request), nu la module load time.
// Cloudflare Pages evalueaza modulele la build fara env vars disponibile.
// Factory function in loc de Proxy — pastreaza tipurile SupabaseClient intacte.

function getEnv(key: string): string {
  const val = (typeof process !== 'undefined' ? process.env[key] : undefined)
    || (typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>)[key] as string : undefined)
  if (!val) {
    throw new Error(
      `[HQS] Variabila de mediu ${key} este obligatorie.\n` +
      'Seteaz-o in Cloudflare Pages → Settings → Environment Variables.'
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

// Compatibilitate backward pentru cod care importa { supabaseUrl, supabaseAnonKey }
export const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Lazy singleton — creat la primul apel, nu la module evaluation
let _client: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _client
}

// `supabase` export — functie lazy cu tipuri corecte, compatibil cu tot codul existent
// Folosit ca: supabase.from(...).select(...) etc.
// Implementat ca getter pe un obiect pentru a evita breaking changes la import.
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
