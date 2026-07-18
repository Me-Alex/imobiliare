import type { Property } from '@/lib/types'

const DEMO_PANORAMA_URL = '/demo/virtual-tour-panorama-demo.png'

// Cohorta este intenționat explicită: 14 din cele 27 de anunțuri Cloudflare
// și 7 din cele 13 anunțuri fallback primesc demo-ul. Un tur real are mereu prioritate.
const DEMO_VIRTUAL_TOUR_SLUGS = new Set([
  'demo-apartament-herastrau-20260718',
  'apartament-3-camere-militari',
  'casa-individuala-cotroceni',
  'apartament-2-camere-first-rent-militari',
  'apartament-3-camere-cotroceni',
  'apartament-2-camere-inchiriere-floreasca',
  'garsoniera-moderna-inchiriere-unirii',
  'penthouse-panoramic-floreasca',
  'apartament-nou-3-camere-floreasca',
  'apartament-4-camere-birou-victoriei',
  'apartament-2-camere-centru-vechi-unirii',
  'apartament-3-camere-vedere-lac-herestrau',
  'apartament-central-2-camere-victoriei',
  'vila-de-lux-herestrau',
  'apartament-luxury-dorobanti',
  'apartament-modern-primaverii',
  'casa-militari-gradina',
  'studio-unirii',
  'vila-premium-baneasa',
  'apartament-4-camere-floreasca',
])

export function withDemoVirtualTour(property: Property): Property {
  if (property.virtualTour || property.status !== 'PUBLISHED' || !DEMO_VIRTUAL_TOUR_SLUGS.has(property.slug)) {
    return property
  }

  const sceneId = `demo-scene-${property.slug}`

  return {
    ...property,
    virtualTour: {
      id: `demo-tour-${property.slug}`,
      provider: 'NATIVE',
      status: 'PUBLISHED',
      title: 'Tur virtual demonstrativ',
      isDemo: true,
      entrySceneId: sceneId,
      scenes: [{
        id: sceneId,
        title: 'Interior demonstrativ',
        imageUrl: DEMO_PANORAMA_URL,
        sortOrder: 0,
        initialYaw: 0,
        initialPitch: 0,
        initialFov: 100,
        hotspots: [],
      }],
    },
  }
}

export function withDemoVirtualTours(properties: Property[]): Property[] {
  return properties.map(withDemoVirtualTour)
}
