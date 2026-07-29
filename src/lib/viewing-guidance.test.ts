import { describe, expect, it } from 'vitest'

import type { Vizionare } from '@/lib/types'
import { getViewingGuidance } from '@/lib/viewing-guidance'

function viewing(
  status: Vizionare['status'],
  extras: Partial<Pick<Vizionare, 'rating' | 'wouldProceed'>> = {},
) {
  return { status, ...extras }
}

describe('getViewingGuidance', () => {
  it('asks staff to confirm a pending request while the client waits', () => {
    expect(getViewingGuidance(viewing('pending'), 'staff').action).toBe('confirm')
    expect(getViewingGuidance(viewing('pending'), 'client').action).toBe('none')
  })

  it('follows the attendance sequence for staff', () => {
    expect(getViewingGuidance(viewing('confirmed'), 'staff').action).toBe('check_in')
    expect(getViewingGuidance(viewing('checked_in'), 'staff').action).toBe('complete')
    expect(getViewingGuidance(viewing('completed'), 'staff').action).toBe('documents')
  })

  it('collects client feedback before offering the transaction workspace', () => {
    expect(getViewingGuidance(viewing('completed'), 'client').action).toBe('feedback')
    expect(getViewingGuidance(viewing('completed', { rating: 5, wouldProceed: true }), 'client').action)
      .toBe('deal_room')
  })

  it('does not start a transaction for an uninterested client', () => {
    expect(getViewingGuidance(viewing('completed', { rating: 3, wouldProceed: false }), 'client').action)
      .toBe('documents')
  })

  it('offers a new appointment after cancellation or no-show only to the client', () => {
    expect(getViewingGuidance(viewing('cancelled_by_agent'), 'client').action).toBe('reschedule')
    expect(getViewingGuidance(viewing('no_show'), 'client').action).toBe('reschedule')
    expect(getViewingGuidance(viewing('no_show'), 'staff').action).toBe('none')
  })
})
