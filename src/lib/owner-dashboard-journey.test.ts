import { describe, expect, it } from 'vitest'

import { getOwnerDashboardJourney, type OwnerDashboardJourneyInput } from '@/lib/owner-dashboard-journey'

const BASE: OwnerDashboardJourneyInput = {
  qualityScore: 88,
  adjustmentPercent: 0,
  views: 120,
  inquiries: 0,
  viewings: 0,
  feedbackCount: 0,
  missingDocuments: 0,
}

describe('getOwnerDashboardJourney', () => {
  it('prioritizes listing quality when the announcement is weak', () => {
    const journey = getOwnerDashboardJourney({
      ...BASE,
      qualityScore: 52,
      adjustmentPercent: 9,
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'listing',
      state: 'attention',
      target: 'listing-quality',
    })
    expect(journey.progressPercent).toBe(0)
  })

  it('moves attention to pricing after the listing is ready', () => {
    const journey = getOwnerDashboardJourney({
      ...BASE,
      adjustmentPercent: 7,
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'market',
      state: 'attention',
      value: '-7%',
      target: 'pricing',
    })
    expect(journey.completedCount).toBe(1)
  })

  it('shows viewings as active when interest starts but feedback is missing', () => {
    const journey = getOwnerDashboardJourney({
      ...BASE,
      inquiries: 2,
      viewings: 1,
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'market',
      state: 'active',
    })
    expect(journey.stages.find((stage) => stage.id === 'viewings')).toMatchObject({
      state: 'active',
      value: '3 interacțiuni',
    })
    expect(journey.stages.find((stage) => stage.id === 'transaction')).toMatchObject({
      state: 'active',
      value: 'pregătit',
    })
  })

  it('keeps document blockers visible even after feedback arrives', () => {
    const journey = getOwnerDashboardJourney({
      ...BASE,
      inquiries: 1,
      viewings: 2,
      feedbackCount: 2,
      missingDocuments: 3,
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'transaction',
      state: 'attention',
      target: 'documents',
      value: '3 lipsă',
    })
    expect(journey.completedCount).toBe(2)
  })
})
