import { createClient } from '@supabase/supabase-js'

// Variabilele de mediu sunt obligatorii. Daca lipsesc, aplicatia nu trebuie sa porneasca cu valori hardcodate.
// Copiaza .env.local.example in .env.local si completeaza valorile reale.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[HQS] Variabilele de mediu NEXT_PUBLIC_SUPABASE_URL si NEXT_PUBLIC_SUPABASE_ANON_KEY sunt obligatorii.\n' +
    'Copiaza .env.local.example in .env.local si completeaza valorile.'
  )
}

export { supabaseUrl, supabaseAnonKey }
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
