import type { Property } from '@/lib/types'

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartament',
  Apartament: 'Apartament',
  HOUSE: 'Casă',
  Casa: 'Casă',
  VILLA: 'Vilă',
  Vila: 'Vilă',
  LAND: 'Teren',
  Teren: 'Teren',
  COMMERCIAL: 'Spațiu comercial',
  Comercial: 'Spațiu comercial',
}

export const TRANSACTION_LABELS: Record<string, string> = {
  SALE: 'Vânzare',
  VANZARE: 'Vânzare',
  Vanzare: 'Vânzare',
  RENT: 'Închiriere',
  INCHIRIERE: 'Închiriere',
  Inchiriere: 'Închiriere',
}

const FEATURE_RULES: Array<{ terms: string[]; label: string; category: string }> = [
  { terms: ['parcare subterană', 'parcare subterana'], label: 'Parcare subterană', category: 'Acces' },
  { terms: ['parcare'], label: 'Loc de parcare', category: 'Acces' },
  { terms: ['garaj dublu'], label: 'Garaj dublu', category: 'Acces' },
  { terms: ['garaj'], label: 'Garaj', category: 'Acces' },
  { terms: ['balcon'], label: 'Balcon', category: 'Spații exterioare' },
  { terms: ['terasă', 'terasa'], label: 'Terasă', category: 'Spații exterioare' },
  { terms: ['grădină', 'gradina'], label: 'Grădină', category: 'Spații exterioare' },
  { terms: ['piscină', 'piscina'], label: 'Piscină', category: 'Confort' },
  { terms: ['aer condiționat', 'aer conditionat'], label: 'Aer condiționat', category: 'Confort' },
  { terms: ['centrală proprie', 'centrala proprie'], label: 'Centrală proprie', category: 'Utilități' },
  { terms: ['smart home'], label: 'Sistem smart home', category: 'Confort' },
  { terms: ['mobilat'], label: 'Mobilat', category: 'Interior' },
  { terms: ['utilat'], label: 'Utilat', category: 'Interior' },
  { terms: ['pază', 'paza 24/7'], label: 'Pază', category: 'Siguranță' },
  { terms: ['pivniță', 'pivnita'], label: 'Pivniță', category: 'Depozitare' },
  { terms: ['vedere panoramică', 'vedere panoramica'], label: 'Vedere panoramică', category: 'Confort' },
  { terms: ['toate utilitățile', 'toate utilitatile'], label: 'Utilități la limită', category: 'Utilități' },
]

export interface PropertyFeature {
  label: string
  category: string
}

export function parseGalleryUrls(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export function getPropertyImages(property: Property): string[] {
  const gallery = parseGalleryUrls(property.galleryUrls)
  const fallback = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85'
  const cover = property.coverUrl || gallery[0] || fallback
  return [cover, ...gallery.filter((url) => url !== cover)]
}

export function getPropertyFeatures(property: Property): PropertyFeature[] {
  const source = `${property.title} ${property.description}`.toLocaleLowerCase('ro-RO')
  const seen = new Set<string>()

  return FEATURE_RULES.filter((rule) => rule.terms.some((term) => source.includes(term)))
    .filter((rule) => {
      if (seen.has(rule.label)) return false
      if (rule.label === 'Loc de parcare' && seen.has('Parcare subterană')) return false
      if (rule.label === 'Garaj' && seen.has('Garaj dublu')) return false
      seen.add(rule.label)
      return true
    })
    .map(({ label, category }) => ({ label, category }))
}

export function getRelatedProperties(property: Property, candidates: Property[], limit = 3): Property[] {
  return candidates
    .filter((candidate) => candidate.id !== property.id && candidate.status === 'PUBLISHED')
    .map((candidate) => {
      let score = 0
      if (candidate.zone === property.zone) score += 5
      if (candidate.transaction === property.transaction) score += 3
      if (candidate.type === property.type) score += 2
      const priceDifference = Math.abs(candidate.price - property.price) / Math.max(property.price, 1)
      if (priceDifference <= 0.2) score += 2
      else if (priceDifference <= 0.4) score += 1
      return { candidate, score }
    })
    .sort((a, b) => b.score - a.score || Number(b.candidate.featured) - Number(a.candidate.featured))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

export function formatPropertyUpdatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Dată neprecizată'
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getMapEmbedUrl(lat: number, lng: number): string {
  const delta = 0.008
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`
}

export function getNearbySearchUrl(query: string, property: Property): string {
  const location = property.lat && property.lng
    ? `${property.lat},${property.lng}`
    : `${property.zone}, București`
  return `https://www.google.com/maps/search/${encodeURIComponent(`${query} lângă ${location}`)}`
}
