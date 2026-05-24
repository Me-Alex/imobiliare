import type { Property, PropertyType } from '@/lib/supabase'

const PHOTO_MEDIA: Record<PropertyType, string> = {
  VILLA: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
  HOUSE: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  APARTMENT: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  LAND: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  COMMERCIAL: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
}

const INLINE_FALLBACK_MEDIA: Record<PropertyType, string> = {
  VILLA: makeInlineVisual('Vila premium', '#40da8a', 'Gradina privata', 'Lumina naturala'),
  HOUSE: makeInlineVisual('Casa familiala', '#40da8a', 'Spatiu generos', 'Cartier linistit'),
  APARTMENT: makeInlineVisual('Apartament urban', '#40da8a', 'Living luminos', 'Aproape de oras'),
  LAND: makeInlineVisual('Teren verificat', '#40da8a', 'Acces facil', 'Potential clar'),
  COMMERCIAL: makeInlineVisual('Spatiu comercial', '#40da8a', 'Flux bun', 'Zona activa'),
}

const FALLBACK_MEDIA: Record<PropertyType, string[]> = {
  VILLA: [
    PHOTO_MEDIA.VILLA,
    INLINE_FALLBACK_MEDIA.VILLA,
  ],
  HOUSE: [
    PHOTO_MEDIA.HOUSE,
    INLINE_FALLBACK_MEDIA.HOUSE,
  ],
  APARTMENT: [
    PHOTO_MEDIA.APARTMENT,
    INLINE_FALLBACK_MEDIA.APARTMENT,
  ],
  LAND: [
    PHOTO_MEDIA.LAND,
    INLINE_FALLBACK_MEDIA.LAND,
  ],
  COMMERCIAL: [
    PHOTO_MEDIA.COMMERCIAL,
    INLINE_FALLBACK_MEDIA.COMMERCIAL,
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
    fallbackCover: fallback[fallback.length - 1],
    isFallback: images.length === 0,
  }
}

function normalizeGallery(value: Property['gallery_urls']) {
  if (!Array.isArray(value)) return []
  return value.filter(isPublicImageUrl)
}

function isPublicImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const next = value.trim()
  if (/^https?:\/\//.test(next)) return true
  return /^\/(?:images|uploads)\//.test(next)
}

function makeInlineVisual(title: string, accent: string, lineOne: string, lineTwo: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#101820"/>
          <stop offset="0.55" stop-color="#142029"/>
          <stop offset="1" stop-color="#071012"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.04"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <path d="M0 585 C190 510 280 600 450 530 C630 456 736 492 880 432 C1010 378 1115 390 1200 342 L1200 800 L0 800 Z" fill="#0b1518"/>
      <rect x="92" y="108" width="1016" height="548" rx="42" fill="url(#glass)" stroke="${accent}" stroke-opacity="0.32" stroke-width="2"/>
      <path d="M248 478 L600 238 L952 478" fill="none" stroke="${accent}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M338 468 L338 592 L862 592 L862 468" fill="none" stroke="#ffffff" stroke-opacity="0.74" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="535" y="454" width="130" height="138" rx="8" fill="${accent}" fill-opacity="0.84"/>
      <rect x="395" y="462" width="88" height="72" rx="10" fill="#ffffff" fill-opacity="0.72"/>
      <rect x="716" y="462" width="88" height="72" rx="10" fill="#ffffff" fill-opacity="0.72"/>
      <text x="92" y="718" fill="#ffffff" font-family="Arial, sans-serif" font-size="46" font-weight="800">${title}</text>
      <text x="92" y="760" fill="#b7c6c8" font-family="Arial, sans-serif" font-size="24">${lineOne} / ${lineTwo}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`
}
