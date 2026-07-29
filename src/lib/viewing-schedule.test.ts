import { describe, expect, it } from 'vitest'

import type { AvailabilitySlot, StaffMember } from '@/lib/types'
import { getRecommendedViewingSlots } from '@/lib/viewing-schedule'

const STAFF: StaffMember[] = [
  { id: 'a', name: 'Ana', email: 'a@example.com', phone: '1', role: 'Agent', avatarInitials: 'A', isActive: true },
  { id: 'b', name: 'Bogdan', email: 'b@example.com', phone: '2', role: 'Agent', avatarInitials: 'B', isActive: false },
]

function slot(id: string, staffId: string, date: string, startTime: string, isBooked = false): AvailabilitySlot {
  return {
    id,
    staffId,
    date,
    startTime,
    endTime: `${String(Number(startTime.slice(0, 2)) + 1).padStart(2, '0')}:00`,
    isBooked,
    bookedBy: null,
    bookedByName: null,
  }
}

describe('getRecommendedViewingSlots', () => {
  it('returns the earliest future slots in chronological order', () => {
    const result = getRecommendedViewingSlots([
      slot('late', 'a', '2026-08-03', '14:00'),
      slot('early', 'a', '2026-08-01', '09:00'),
      slot('mid', 'a', '2026-08-01', '13:00'),
    ], STAFF, '2026-07-30', 2)

    expect(result.map((item) => item.slot.id)).toEqual(['early', 'mid'])
  })

  it('excludes booked, stale, unknown, and inactive-agent slots', () => {
    const result = getRecommendedViewingSlots([
      slot('valid', 'a', '2026-08-01', '09:00'),
      slot('booked', 'a', '2026-08-01', '10:00', true),
      slot('today', 'a', '2026-07-30', '11:00'),
      slot('inactive', 'b', '2026-08-01', '12:00'),
      slot('unknown', 'missing', '2026-08-01', '13:00'),
    ], STAFF, '2026-07-30')

    expect(result.map((item) => item.slot.id)).toEqual(['valid'])
  })
})
