import { describe, expect, it } from 'vitest'
import { analyzeOwnerProperty, ownerFeedbackText, ownerEventSummary } from './owner-performance'
import type { WorkspaceProperty } from './transaction-workspace'

const subject: WorkspaceProperty = { id: 'subject', title: 'Apartment', type: 'APARTMENT', city: 'București', zone: 'Centru', transaction_type: 'SALE', currency: 'EUR', price: 120000, area_sqm: 60 }
const comparables = ['a', 'b', 'c'].map(id => ({ ...subject, id, price: 90000 }))

describe('owner price comparison', () => {
  it('requires three real comparable properties instead of treating the subject price as market data', () => {
    for (const rows of [[], comparables.slice(0, 2)]) {
      expect(analyzeOwnerProperty(subject, rows)).toMatchObject({ hasComparison: false, marketAverage: null, adjustmentPercent: 0 })
    }
  })
  it('excludes different currencies, transactions, cities, zones and the subject itself', () => {
    const unrelated = [subject, { ...comparables[0], currency: 'RON' }, { ...comparables[1], transaction_type: 'RENT' }, { ...comparables[2], city: 'Cluj' }, { ...comparables[0], zone: 'Nord' }]
    expect(analyzeOwnerProperty(subject, unrelated).comparableCount).toBe(0)
  })
  it('calculates from compatible listings and does not round low-value prices to zero', () => {
    expect(analyzeOwnerProperty(subject, comparables)).toMatchObject({ hasComparison: true, marketAverage: 1500, adjustmentPercent: 15, recommendedPrice: 102000 })
    expect(analyzeOwnerProperty({ ...subject, transaction_type: 'RENT', price: 600 }, comparables.map(item => ({ ...item, transaction_type: 'RENT', price: 450 }))).recommendedPrice).toBe(510)
  })
  it('does not infer price positioning without a valid subject area', () => {
    expect(analyzeOwnerProperty({ ...subject, area_sqm: null }, comparables)).toMatchObject({ hasComparison: false, propertyPricePerSqm: null })
  })
})

it('distinguishes no decision from a declined viewing and preserves comments', () => {
  expect(ownerFeedbackText({ rating: 4, would_proceed: null })).toBe('Evaluare trimisă fără comentariu sau decizie.')
  expect(ownerFeedbackText({ would_proceed: false })).toContain('Nu dorește')
  expect(ownerFeedbackText({ would_proceed: true })).toContain('Interes confirmat')
  expect(ownerFeedbackText({ feedback: ' Bună lumină ', would_proceed: false })).toBe('Bună lumină')
})

it('translates known generated events without rewriting free text or unknown states', () => {
  expect(ownerEventSummary('Etapa a fost schimbată din OFFER în CONTRACT')).toBe('Etapă: Ofertă → Contract')
  expect(ownerEventSummary('Starea ofertei a fost actualizată în ACCEPTED')).toBe('Ofertă: Acceptată')
  expect(ownerEventSummary('Clientul a menționat OFFER')).toBe('Clientul a menționat OFFER')
  expect(ownerEventSummary('Starea ofertei a fost actualizată în FUTURE_STATUS')).toBe('Starea ofertei a fost actualizată în FUTURE_STATUS')
})
