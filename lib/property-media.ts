import type { Property, PropertyType } from '@/lib/supabase'

const FALLBACK_MEDIA: Record<PropertyType, string[]> = {
  VILLA: [
    '/images/property-villa.png',
    '/images/hqs-hero.png',
  ],
  HOUSE: [
    '/images/property-house.png',
    '/images/hqs-hero.png',
  ],
  APARTMENT: [
    '/images/property-apartment.png',
    '/images/hqs-hero.png',
  ],
  LAND: [
    '/images/property-land.png',
    '/images/hqs-hero.png',
  ],
  COMMERCIAL: [
    '/images/property-commercial.png',
    '/images/hqs-hero.png',
  ],
}

export function getPropertyMedia(property: Pick<Property, 'type' | 'cover_image_url' | 'gallery_urls'>) {
  const gallery = normalizeGallery(property.gallery_urls)
  const images = [property.cover_image_url, ...gallery].filter(isPublicImageUrl)
  const fallback = FALLBACK_MEDIA[property.type] || FALLBACK_MEDIA.APARTMENT
  const resolved = images.length ? Array.from(new Set(images)) : fallback

  return {
    cover: resolved[0],
    gallery: resolved.length > 1 ? resolved : fallback,
    fallbackCover: fallback[0],
    isFallback: images.length === 0,
  }
}

function normalizeGallery(value: Property['gallery_urls']) {
  if (!Array.isArray(value)) return []
  return value.filter(isPublicImageUrl)
}

function isPublicImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value.trim())
}
