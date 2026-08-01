import { describe, expect, it } from 'vitest'

import {
  getPropertyPublicationMilestones,
  getPropertyPublicationReadiness,
  getPublishedPropertyQuality,
  type PropertyPublicationReadinessInput,
} from './property-publication-readiness'

function listing(input: Partial<PropertyPublicationReadinessInput> = {}): PropertyPublicationReadinessInput {
  return {
    title: '',
    description: '',
    type: '',
    transaction: 'VANZARE',
    price: '',
    areaSqm: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    yearBuilt: '',
    address: '',
    zone: '',
    sector: '',
    lat: null,
    lng: null,
    galleryUrls: [],
    virtualTourMode: 'NONE',
    virtualTourValid: false,
    currentYear: 2026,
    ...input,
  }
}

describe('getPropertyPublicationReadiness', () => {
  it('requires the minimum fields needed before publishing', () => {
    const readiness = getPropertyPublicationReadiness(listing())

    expect(readiness.canPublish).toBe(false)
    expect(readiness.requiredItems.map((item) => item.fieldId)).toEqual([
      'title',
      'description',
      'property-type',
      'price',
      'area',
      'rooms',
      'property-sector',
      'property-zone',
      'address',
    ])
    expect(readiness.recommendations[0]).toMatchObject({
      priority: 'required',
      sectionId: 'property-step-basic',
    })
  })

  it('does not require rooms or construction year for land listings', () => {
    const readiness = getPropertyPublicationReadiness(listing({
      title: 'Teren intravilan cu deschidere mare',
      description: 'Teren intravilan potrivit pentru dezvoltare rezidentiala, cu utilitati la limita proprietatii.',
      type: 'Teren',
      price: '180000',
      areaSqm: '500',
      sector: 'Sector 6',
      zone: 'Drumul Taberei',
      address: 'Drumul Taberei 120',
    }))

    expect(readiness.isLand).toBe(true)
    expect(readiness.canPublish).toBe(true)
    expect(readiness.requiredItems).toEqual([])
  })

  it('treats the map pin and richer media as quality recommendations, not publish blockers', () => {
    const readiness = getPropertyPublicationReadiness(listing({
      title: 'Apartament luminos cu 3 camere in Dorobanti',
      description: 'Apartament luminos cu compartimentare eficienta, finisaje moderne si acces rapid la parcuri, scoli si mijloace de transport.',
      type: 'Apartament',
      price: '250000',
      areaSqm: '90',
      rooms: '3',
      sector: 'Sector 1',
      zone: 'Dorobanti',
      address: 'Strada Dorobanti 45',
      galleryUrls: ['https://example.com/cover.jpg'],
      yearBuilt: '2020',
    }))

    expect(readiness.canPublish).toBe(true)
    expect(readiness.recommendations.map((item) => item.id)).toEqual(
      expect.arrayContaining(['map-pin', 'gallery-depth', 'virtual-tour']),
    )
  })

  it('blocks publishing when a selected virtual tour is incomplete', () => {
    const readiness = getPropertyPublicationReadiness(listing({
      title: 'Apartament luminos cu 3 camere in Dorobanti',
      description: 'Apartament luminos cu compartimentare eficienta, finisaje moderne si acces rapid la parcuri, scoli si mijloace de transport.',
      type: 'Apartament',
      price: '250000',
      areaSqm: '90',
      rooms: '3',
      sector: 'Sector 1',
      zone: 'Dorobanti',
      address: 'Strada Dorobanti 45',
      virtualTourMode: 'EXTERNAL',
      virtualTourValid: false,
    }))

    expect(readiness.canPublish).toBe(false)
    expect(readiness.requiredItems).toContainEqual(expect.objectContaining({
      fieldId: 'property-step-virtual-tour',
    }))
  })
})

describe('getPropertyPublicationMilestones', () => {
  it('starts incomplete listings at the publishable milestone', () => {
    const milestones = getPropertyPublicationMilestones(getPropertyPublicationReadiness(listing()))

    expect(milestones.map((item) => item.id)).toEqual(['publishable', 'competitive', 'premium'])
    expect(milestones[0]).toMatchObject({
      id: 'publishable',
      status: 'current',
      sectionId: 'property-step-basic',
    })
    expect(milestones[1].status).toBe('next')
  })

  it('moves publishable listings toward competitive media and map quality', () => {
    const milestones = getPropertyPublicationMilestones(getPropertyPublicationReadiness(listing({
      title: 'Apartament luminos cu 3 camere in Dorobanti',
      description: 'Apartament luminos cu compartimentare eficienta, finisaje moderne si acces rapid la parcuri, scoli si mijloace de transport.',
      type: 'Apartament',
      price: '250000',
      areaSqm: '90',
      rooms: '3',
      sector: 'Sector 1',
      zone: 'Dorobanti',
      address: 'Strada Dorobanti 45',
    })))

    expect(milestones[0]).toMatchObject({ id: 'publishable', status: 'complete' })
    expect(milestones[1]).toMatchObject({
      id: 'competitive',
      status: 'current',
      sectionId: 'property-step-location',
    })
  })

  it('marks all milestones complete for a premium listing', () => {
    const milestones = getPropertyPublicationMilestones(getPropertyPublicationReadiness(listing({
      title: 'Apartament luminos cu 3 camere in Dorobanti',
      description: 'Apartament luminos, renovat recent, cu compartimentare eficienta, bucatarie inchisa, doua bai, balcon generos si acces rapid la parcuri, scoli si mijloace de transport in comun. Este potrivit pentru o familie care vrea acces rapid la servicii, transport si zone verzi.',
      type: 'Apartament',
      price: '250000',
      areaSqm: '90',
      rooms: '3',
      sector: 'Sector 1',
      zone: 'Dorobanti',
      address: 'Strada Dorobanti 45',
      lat: 44.458,
      lng: 26.096,
      galleryUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
      yearBuilt: '2020',
      virtualTourMode: 'NATIVE',
      virtualTourValid: true,
    })))

    expect(milestones.every((item) => item.status === 'complete')).toBe(true)
    expect(milestones[2]).toMatchObject({
      id: 'premium',
      actionLabel: 'Verifică recomandările',
    })
  })
})

describe('getPublishedPropertyQuality', () => {
  it('scores a complete published property across Supabase-style fields', () => {
    const quality = getPublishedPropertyQuality({
      title: 'Apartament luminos cu 3 camere in Dorobanti',
      description: 'Apartament luminos, renovat recent, cu compartimentare eficienta, bucatarie inchisa, doua bai, balcon generos si acces rapid la parcuri, scoli si mijloace de transport in comun. Este potrivit pentru o familie care vrea acces rapid la servicii, transport si zone verzi.',
      type: 'APARTMENT',
      transaction_type: 'VANZARE',
      price: 250000,
      area_sqm: 90,
      rooms: 3,
      address: 'Strada Dorobanti 45',
      zone: 'Dorobanti',
      sector: 'Sector 1',
      lat: 44.458,
      lng: 26.096,
      cover_image_url: 'https://example.com/cover.jpg',
      gallery_urls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
      amenities: ['lift', 'parcare', 'balcon', 'centrala proprie'],
      year_built: 2020,
      virtual_tours: [{ status: 'PUBLISHED', provider: 'NATIVE' }],
    })

    expect(quality.score).toBe(100)
    expect(quality.recommendations).toEqual([])
    expect(quality.nextAction).toBeNull()
  })

  it('prioritizes clear next actions for incomplete managed listings', () => {
    const quality = getPublishedPropertyQuality({
      title: 'Garsoniera Titan',
      description: 'Descriere scurta.',
      type: 'Apartament',
      price: 65000,
      areaSqm: 33,
      rooms: 1,
      zone: 'Titan',
      galleryUrls: '[]',
    })

    expect(quality.score).toBeLessThan(70)
    expect(quality.recommendations.map((item) => item.id)).toEqual(
      expect.arrayContaining(['title-depth', 'description-depth', 'map-pin', 'cover-photo', 'virtual-tour']),
    )
    expect(quality.nextAction).toBe('Fă titlul mai specific')
  })
})
