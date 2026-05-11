import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Lipsesc variabilele de mediu Supabase')
}

export const supabase = createClient(url, anonKey)

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

export type PropertySeed = Pick<Property, 'title' | 'slug' | 'description' | 'price' | 'currency' | 'type' | 'status' | 'city' | 'county' | 'address' | 'area_sqm' | 'rooms' | 'bathrooms' | 'parking_spots' | 'featured'>

export const propertiesSeed: PropertySeed[] = [
  { title: 'Vilă modernă cu grădină în Corbeanca', slug: 'vila-moderna-cu-gradina-corbeanca', description: 'Vilă luminoasă, cu living generos, curte amenajată și acces rapid către zona de nord.', price: 385000, currency: 'EUR', type: 'VILLA', status: 'PUBLISHED', city: 'Corbeanca', county: 'Ilfov', address: 'Corbeanca, zona Paradisul Verde', area_sqm: 210, rooms: 5, bathrooms: 4, parking_spots: 2, featured: true },
  { title: 'Apartament 3 camere în Floreasca', slug: 'apartament-3-camere-floreasca', description: 'Apartament renovat, etaj intermediar, finisaje curate și poziție bună pentru birou sau locuit.', price: 245000, currency: 'EUR', type: 'APARTMENT', status: 'PUBLISHED', city: 'Bucuresti', county: 'Bucuresti', address: 'Floreasca, str. intrare linistita', area_sqm: 92, rooms: 3, bathrooms: 2, parking_spots: 1, featured: true },
  { title: 'Casă individuală în Băneasa', slug: 'casa-individuala-baneasa', description: 'Casă pe teren propriu, compartimentare echilibrată și curte suficientă pentru familie.', price: 520000, currency: 'EUR', type: 'HOUSE', status: 'PUBLISHED', city: 'Bucuresti', county: 'Bucuresti', address: 'Băneasa, aproape de pădure', area_sqm: 240, rooms: 6, bathrooms: 4, parking_spots: 2, featured: false },
  { title: 'Penthouse cu terasă în Aviatorilor', slug: 'penthouse-terasa-aviatorilor', description: 'Penthouse cu vedere deschisă, terasă mare și acces rapid la parc și metrou.', price: 690000, currency: 'EUR', type: 'APARTMENT', status: 'PUBLISHED', city: 'Bucuresti', county: 'Bucuresti', address: 'Aviatorilor, zonă premium', area_sqm: 165, rooms: 4, bathrooms: 3, parking_spots: 2, featured: true },
  { title: 'Teren intravilan în Pipera', slug: 'teren-intravilan-pipera', description: 'Teren potrivit pentru dezvoltare rezidențială, cu acces bun și utilități în zonă.', price: 330000, currency: 'EUR', type: 'LAND', status: 'PUBLISHED', city: 'Pipera', county: 'Ilfov', address: 'Pipera, zona de nord', area_sqm: 900, rooms: 0, bathrooms: 0, parking_spots: 0, featured: false },
]
