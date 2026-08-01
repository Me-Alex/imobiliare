import { describe, expect, it } from 'vitest'

import { getOwnerDashboardPriority, type OwnerDashboardGuidanceInput } from '@/lib/owner-dashboard-guidance'

const BASE: OwnerDashboardGuidanceInput = {
  qualityScore: 90,
  qualityNextAction: null,
  missingDocuments: 0,
  adjustmentPercent: 0,
  views: 120,
  inquiries: 0,
  viewings: 0,
  feedbackCount: 0,
}

describe('getOwnerDashboardPriority', () => {
  it('prioritizes missing documents before listing or pricing work', () => {
    const result = getOwnerDashboardPriority({
      ...BASE,
      qualityScore: 40,
      qualityNextAction: 'Adaugă fotografii',
      missingDocuments: 2,
      adjustmentPercent: 8,
    })

    expect(result.guidance).toMatchObject({
      target: 'documents',
      priority: 'high',
    })
    expect(result.signals.find((signal) => signal.id === 'documents')).toMatchObject({
      value: '2',
      state: 'attention',
    })
  })

  it('focuses weak listings on quality recommendations', () => {
    const result = getOwnerDashboardPriority({
      ...BASE,
      qualityScore: 62,
      qualityNextAction: 'Adaugă minimum 5 fotografii',
    })

    expect(result.guidance).toMatchObject({
      title: 'Adaugă minimum 5 fotografii',
      target: 'listing-quality',
      priority: 'high',
    })
  })

  it('recommends pricing review after quality and documents are fine', () => {
    const result = getOwnerDashboardPriority({
      ...BASE,
      adjustmentPercent: 6,
    })

    expect(result.guidance).toMatchObject({
      target: 'pricing',
      priority: 'normal',
    })
    expect(result.signals.find((signal) => signal.id === 'pricing')).toMatchObject({
      value: '-6%',
      state: 'attention',
    })
  })

  it('uses active interest as the next step when the listing is healthy', () => {
    const result = getOwnerDashboardPriority({
      ...BASE,
      inquiries: 1,
      viewings: 2,
    })

    expect(result.guidance.target).toBe('appointments')
    expect(result.signals.find((signal) => signal.id === 'interest')).toMatchObject({
      value: '3',
      state: 'good',
    })
  })
})
