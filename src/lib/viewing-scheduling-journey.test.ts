import { describe, expect, it } from 'vitest'

import { getViewingSchedulingJourney, type ViewingSchedulingJourneyInput } from '@/lib/viewing-scheduling-journey'

const empty: ViewingSchedulingJourneyInput = {
  hasProperty: false,
  hasStaff: false,
  hasDate: false,
  hasSlot: false,
  termsAccepted: false,
  privacyAccepted: false,
  privacyNoticeReady: false,
  complianceLoading: true,
}

describe('getViewingSchedulingJourney', () => {
  it('starts with property selection', () => {
    const journey = getViewingSchedulingJourney(empty)

    expect(journey.currentStage).toMatchObject({
      id: 'property',
      state: 'current',
      step: 1,
    })
    expect(journey.progressPercent).toBe(0)
  })

  it('moves to slot selection after the property is selected', () => {
    const journey = getViewingSchedulingJourney({
      ...empty,
      hasProperty: true,
    })

    expect(journey.currentStage).toMatchObject({
      id: 'slot',
      state: 'current',
      step: 2,
    })
    expect(journey.completedCount).toBe(1)
  })

  it('blocks scheduling when the privacy notice is missing after compliance loads', () => {
    const journey = getViewingSchedulingJourney({
      ...empty,
      hasProperty: true,
      hasStaff: true,
      hasDate: true,
      hasSlot: true,
      complianceLoading: false,
      privacyNoticeReady: false,
    })

    expect(journey.headline).toBe('Programarea este blocată temporar')
    expect(journey.currentStage).toMatchObject({
      id: 'consent',
      state: 'blocked',
      actionLabel: 'GDPR lipsă',
    })
  })

  it('marks the form ready for confirmation after all agreements are accepted', () => {
    const journey = getViewingSchedulingJourney({
      ...empty,
      hasProperty: true,
      hasStaff: true,
      hasDate: true,
      hasSlot: true,
      complianceLoading: false,
      privacyNoticeReady: true,
      termsAccepted: true,
      privacyAccepted: true,
    })

    expect(journey.currentStage).toMatchObject({
      id: 'afterBooking',
      state: 'current',
      actionLabel: 'Gata de confirmare',
    })
    expect(journey.completedCount).toBe(3)
    expect(journey.progressPercent).toBe(75)
  })
})
