import type { Property } from '@/lib/types'

const DEMO_PANORAMAS = {
  living: '/demo/virtual-tour-panorama-demo.png',
  hallway: '/demo/virtual-tour-panorama-hallway.png',
  kitchen: '/demo/virtual-tour-panorama-kitchen.png',
  bedroom: '/demo/virtual-tour-panorama-bedroom.png',
} as const

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

  const sceneIds = {
    living: `demo-scene-${property.slug}-living`,
    hallway: `demo-scene-${property.slug}-hallway`,
    kitchen: `demo-scene-${property.slug}-kitchen`,
    bedroom: `demo-scene-${property.slug}-bedroom`,
  } as const

  return {
    ...property,
    virtualTour: {
      id: `demo-tour-${property.slug}`,
      provider: 'NATIVE',
      status: 'PUBLISHED',
      title: 'Tur virtual demonstrativ',
      isDemo: true,
      entrySceneId: sceneIds.living,
      scenes: [
        {
          id: sceneIds.living,
          title: 'Living',
          imageUrl: DEMO_PANORAMAS.living,
          sortOrder: 0,
          initialYaw: 0,
          initialPitch: 0,
          initialFov: 100,
          hotspots: [{
            id: `demo-hotspot-${property.slug}-living-hallway`,
            label: 'Intră în hol',
            yaw: 125,
            pitch: -8,
            targetSceneId: sceneIds.hallway,
          }],
        },
        {
          id: sceneIds.hallway,
          title: 'Hol',
          imageUrl: DEMO_PANORAMAS.hallway,
          sortOrder: 1,
          initialYaw: -45,
          initialPitch: 0,
          initialFov: 105,
          hotspots: [
            {
              id: `demo-hotspot-${property.slug}-hallway-living`,
              label: 'Înapoi în living',
              yaw: -78,
              pitch: -8,
              targetSceneId: sceneIds.living,
            },
            {
              id: `demo-hotspot-${property.slug}-hallway-kitchen`,
              label: 'Intră în bucătărie',
              yaw: 56,
              pitch: -8,
              targetSceneId: sceneIds.kitchen,
            },
            {
              id: `demo-hotspot-${property.slug}-hallway-bedroom`,
              label: 'Intră în dormitor',
              yaw: 140,
              pitch: -8,
              targetSceneId: sceneIds.bedroom,
            },
          ],
        },
        {
          id: sceneIds.kitchen,
          title: 'Bucătărie',
          imageUrl: DEMO_PANORAMAS.kitchen,
          sortOrder: 2,
          initialYaw: 0,
          initialPitch: 0,
          initialFov: 100,
          hotspots: [{
            id: `demo-hotspot-${property.slug}-kitchen-hallway`,
            label: 'Înapoi în hol',
            yaw: -135,
            pitch: -8,
            targetSceneId: sceneIds.hallway,
          }],
        },
        {
          id: sceneIds.bedroom,
          title: 'Dormitor',
          imageUrl: DEMO_PANORAMAS.bedroom,
          sortOrder: 3,
          initialYaw: 0,
          initialPitch: 0,
          initialFov: 100,
          hotspots: [{
            id: `demo-hotspot-${property.slug}-bedroom-hallway`,
            label: 'Înapoi în hol',
            yaw: 132,
            pitch: -8,
            targetSceneId: sceneIds.hallway,
          }],
        },
      ],
    },
  }
}

export function withDemoVirtualTours(properties: Property[]): Property[] {
  return properties.map(withDemoVirtualTour)
}
