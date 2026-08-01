import { describe, expect, it } from 'vitest'

import { getPropertyPublicationReadiness, type PropertyPublicationReadinessInput } from './property-publication-readiness'

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
