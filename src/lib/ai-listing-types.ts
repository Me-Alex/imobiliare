export type ListingTone = 'professional' | 'warm' | 'luxury' | 'concise' | 'investor'
export type ListingLanguage = 'ro' | 'en'
export type ListingLength = 'short' | 'medium' | 'long'

export interface ListingInput {
  propertyType: string
  transaction: 'VANZARE' | 'INCHIRIERE'
  zone: string
  city: string
  rooms: number
  bathrooms: number
  surface: number
  price: number
  currency: 'EUR' | 'RON' | 'USD'
  floor?: number
  totalFloors?: number
  yearBuilt?: number
  features: string[]
  highlights?: string
  tone: ListingTone
  language: ListingLanguage
  length: ListingLength
}

export interface ListingVariant {
  id: string
  label: string
  text: string
}

export interface ListingResult {
  variants: ListingVariant[]
  titles: string[]
  generatedBy: 'ai' | 'template'
}
