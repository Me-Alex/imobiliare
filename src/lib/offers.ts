/** Offer / negotiation helpers. */

export const OFFER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'COUNTERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
] as const

export type OfferStatus = (typeof OFFER_STATUSES)[number]

/** Who can perform which action on an offer. */
export type OfferActor = 'buyer' | 'agent' | 'owner' | 'admin' | 'system'

export const OFFER_TRANSITIONS: Record<
  OfferStatus,
  Partial<Record<OfferActor, readonly OfferStatus[]>>
> = {
  DRAFT: {
    buyer: ['SUBMITTED', 'WITHDRAWN'],
    admin: ['SUBMITTED', 'WITHDRAWN'],
  },
  SUBMITTED: {
    agent: ['COUNTERED', 'ACCEPTED', 'REJECTED'],
    owner: ['COUNTERED', 'ACCEPTED', 'REJECTED'],
    admin: ['COUNTERED', 'ACCEPTED', 'REJECTED'],
    buyer: ['WITHDRAWN'],
    system: ['EXPIRED'],
  },
  COUNTERED: {
    buyer: ['SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'], // buyer can accept counter or re-counter via new SUBMITTED
    agent: ['ACCEPTED', 'REJECTED'],
    owner: ['ACCEPTED', 'REJECTED'],
    admin: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    system: ['EXPIRED'],
  },
  ACCEPTED: {},
  REJECTED: {},
  WITHDRAWN: {},
  EXPIRED: {},
}

export function isValidOfferStatus(value: unknown): value is OfferStatus {
  return typeof value === 'string' && (OFFER_STATUSES as readonly string[]).includes(value)
}

export function canTransitionOffer(
  from: OfferStatus,
  to: OfferStatus,
  actor: OfferActor,
): boolean {
  if (from === to) return true
  const allowed = OFFER_TRANSITIONS[from]?.[actor]
  return allowed?.includes(to) ?? false
}

export function isTerminalOfferStatus(status: OfferStatus): boolean {
  return status === 'ACCEPTED' || status === 'REJECTED' || status === 'WITHDRAWN' || status === 'EXPIRED'
}
