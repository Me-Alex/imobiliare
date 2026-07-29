import type { AvailabilitySlot, StaffMember } from '@/lib/types'

export interface RecommendedViewingSlot {
  slot: AvailabilitySlot
  staff: StaffMember
}

export function getRecommendedViewingSlots(
  availability: readonly AvailabilitySlot[],
  staff: readonly StaffMember[],
  today: string,
  limit = 6,
): RecommendedViewingSlot[] {
  if (limit <= 0) return []

  const activeStaff = new Map(
    staff.filter((member) => member.isActive).map((member) => [member.id, member]),
  )

  return availability
    .filter((slot) => !slot.isBooked && slot.date > today && activeStaff.has(slot.staffId))
    .sort((left, right) => {
      const dateComparison = left.date.localeCompare(right.date)
      if (dateComparison !== 0) return dateComparison
      const timeComparison = left.startTime.localeCompare(right.startTime)
      if (timeComparison !== 0) return timeComparison
      return left.staffId.localeCompare(right.staffId)
    })
    .slice(0, limit)
    .map((slot) => ({ slot, staff: activeStaff.get(slot.staffId)! }))
}
