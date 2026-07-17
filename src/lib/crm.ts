/** CRM helpers: lead pipeline, activity logging, validation. */

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING_SCHEDULED',
  'OFFER',
  'WON',
  'LOST',
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const
export type LeadPriority = (typeof LEAD_PRIORITIES)[number]

export const LEAD_SOURCES = [
  'website',
  'contact_form',
  'phone',
  'referral',
  'portal',
  'walk_in',
  'other',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

/** Allowed status transitions (from → to[]). */
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'VIEWING_SCHEDULED', 'LOST'],
  QUALIFIED: ['VIEWING_SCHEDULED', 'OFFER', 'LOST'],
  VIEWING_SCHEDULED: ['OFFER', 'QUALIFIED', 'LOST'],
  OFFER: ['WON', 'LOST', 'VIEWING_SCHEDULED'],
  WON: [],
  LOST: ['NEW'], // allow re-open
}

export function isValidLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value)
}

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true
  return LEAD_TRANSITIONS[from]?.includes(to) ?? false
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function toJsonArray(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(String))
  if (typeof value === 'string' && value.trim()) {
    return JSON.stringify(
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }
  return '[]'
}
