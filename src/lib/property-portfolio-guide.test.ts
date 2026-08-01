import { describe, expect, it } from 'vitest'

import { getPropertyPortfolioGuide } from '@/lib/property-portfolio-guide'
import type { UserProperty } from '@/lib/types'
import type { VirtualTour } from '@/lib/virtual-tours'

const TOUR: VirtualTour = {
  provider: 'NATIVE',
  status: 'PUBLISHED',
  title: 'Tur virtual demo',
  scenes: [
    {
      id: 'scene-1',
      title: 'Living',
      imageUrl: 'https://example.test/tour-living.jpg',
      sortOrder: 0,
      initialYaw: 0,
      initialPitch: 0,
      initialFov: 80,
      hotspots: [],
    },
  ],
}

function property(input: Partial<UserProperty> = {}): UserProperty {
  return {
    id: 'property-1',
    title: 'Apartament luminos în Floreasca',
    status: 'PUBLISHED',
    description: 'Apartament luminos, renovat recent, cu bucătărie închisă, balcon, două băi și acces rapid la parcuri, școli și transport.',
    type: 'Apartament',
    transaction: 'VANZARE',
    price: 185000,
    currency: 'EUR',
    areaSqm: 82,
    area_sqm: 82,
    rooms: 3,
    bathrooms: 2,
    yearBuilt: 2018,
    year_built: 2018,
    address: 'Str. Demo nr. 10',
    zone: 'Floreasca',
    sector: 'Sector 1',
    city: 'București',
    lat: 44.46,
    lng: 26.1,
    coverUrl: 'https://example.test/cover.jpg',
    cover_url: 'https://example.test/cover.jpg',
    galleryUrls: [
      'https://example.test/cover.jpg',
      'https://example.test/living.jpg',
      'https://example.test/kitchen.jpg',
      'https://example.test/bedroom.jpg',
      'https://example.test/bath.jpg',
    ],
    gallery_urls: JSON.stringify([
      'https://example.test/cover.jpg',
      'https://example.test/living.jpg',
      'https://example.test/kitchen.jpg',
      'https://example.test/bedroom.jpg',
      'https://example.test/bath.jpg',
    ]),
    amenities: ['Parcare', 'Lift', 'Balcon', 'Centrală'],
    virtualTour: TOUR,
    virtual_tour: TOUR,
    ...input,
  }
}

describe('getPropertyPortfolioGuide', () => {
  it('starts empty owner portfolios with publication', () => {
    const guide = getPropertyPortfolioGuide({ role: 'OWNER', properties: [] })

    expect(guide.primaryAction).toMatchObject({ target: 'publish' })
    expect(guide.metrics.active).toBe(0)
    expect(guide.cards[0]).toMatchObject({
      id: 'publication',
      tone: 'primary',
    })
  })

  it('prioritizes unfinished drafts before performance monitoring', () => {
    const guide = getPropertyPortfolioGuide({
      role: 'OWNER',
      properties: [
        property({ id: 'draft-1', status: 'DRAFT' }),
        property({ id: 'published-1', status: 'PUBLISHED' }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'optimize',
      propertyId: 'draft-1',
    })
    expect(guide.cards[0]).toMatchObject({
      badgeLabel: '1 draft',
      tone: 'warning',
    })
  })

  it('focuses weak listings on the lowest quality property', () => {
    const guide = getPropertyPortfolioGuide({
      role: 'OWNER',
      properties: [
        property({ id: 'good-1' }),
        property({
          id: 'weak-1',
          title: 'Apartament',
          description: 'Scurt',
          coverUrl: '',
          cover_url: '',
          galleryUrls: [],
          gallery_urls: '[]',
          amenities: [],
          lat: null,
          lng: null,
          virtualTour: null,
          virtual_tour: null,
        }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'optimize',
      propertyId: 'weak-1',
    })
    expect(guide.metrics.needsOptimization).toBe(1)
    expect(guide.cards.find((card) => card.id === 'quality')).toMatchObject({
      tone: 'warning',
      action: expect.objectContaining({ propertyId: 'weak-1' }),
    })
  })

  it('routes otherwise strong listings without virtual tours to services', () => {
    const guide = getPropertyPortfolioGuide({
      role: 'OWNER',
      properties: [
        property({
          id: 'no-tour-1',
          virtualTour: null,
          virtual_tour: null,
        }),
      ],
    })

    expect(guide.metrics.missingTour).toBe(1)
    expect(guide.primaryAction).toMatchObject({
      target: 'services',
      propertyId: 'no-tour-1',
    })
  })

  it('sends admins with healthy portfolios to the admin cockpit', () => {
    const guide = getPropertyPortfolioGuide({
      role: 'ADMIN',
      properties: [property({ id: 'healthy-1' })],
    })

    expect(guide.primaryAction).toMatchObject({ target: 'admin' })
    expect(guide.cards.find((card) => card.id === 'operations')).toMatchObject({
      action: expect.objectContaining({ target: 'admin' }),
    })
  })
})
