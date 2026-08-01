import { describe, it, expect } from 'vitest'
import { canTransition, isTerminal, transition, deriveStatusAfterSignature } from './state-machine'
import { TEMPLATES_IN_ORDER, getTemplate } from './templates'
import { isClientComplete, isOwnerComplete } from './identity'
import { createCoolingOffPeriod, isCoolingOffExpired, canWithdraw, exerciseWithdrawal, getCoolingOffStatus } from './cooling-off'
import { isDocumentExpired, shouldAutoExpire, getExpiryTargetStatus } from './expiration'
import type { Actor, Document } from './types'

const STAFF: Actor = { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }
const CLIENT: Actor = { kind: 'PARTICIPANT', role: 'CLIENT', userId: 'u_client' }
const SYSTEM: Actor = { kind: 'SYSTEM' }
const createDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc_1',
  transactionId: 'tx_1',
  kind: 'reservation_offer',
  stage: 'NEGOTIATION',
  status: 'DRAFT',
  data: {},
  version: 1,
  supersedesId: null,
  file: null,
  createdBy: STAFF.userId,
  expiresAt: null,
  expirationAction: null,
  coolingOff: null,
  signatureEnvelopeId: null,
  createdAt: '2026-07-29T10:00:00Z',
  updatedAt: '2026-07-29T10:00:00Z',
  ...overrides,
})

describe('documents state machine', () => {
  it('exposes six templates in deterministic order', () => {
    expect(TEMPLATES_IN_ORDER).toHaveLength(6)
    // Ordering is intentional: later templates should always have a higher `order`.
    for (let i = 1; i < TEMPLATES_IN_ORDER.length; i++) {
      expect(TEMPLATES_IN_ORDER[i]!.order).toBeGreaterThanOrEqual(
        TEMPLATES_IN_ORDER[i - 1]!.order,
      )
    }
  })

  it('classifies terminal states', () => {
    expect(isTerminal('REJECTED')).toBe(true)
    expect(isTerminal('CANCELLED')).toBe(true)
    expect(isTerminal('SUPERSEDED')).toBe(true)
    expect(isTerminal('DRAFT')).toBe(false)
    expect(isTerminal('SIGNED')).toBe(false)
  })

  it('refuses to leave a terminal state', () => {
    const result = transition('REJECTED', 'APPROVED', STAFF)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('TERMINAL_STATE')
  })

  it('allows DRAFT → REQUESTED for any participant', () => {
    expect(canTransition('DRAFT', 'REQUESTED')).toBe(true)
    const result = transition('DRAFT', 'REQUESTED', CLIENT)
    expect(result.ok).toBe(true)
  })

  it('rejects DRAFT → IN_REVIEW (not a legal target from DRAFT)', () => {
    const result = transition('DRAFT', 'IN_REVIEW', STAFF)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('ILLEGAL_TRANSITION')
  })

  it('rejects IN_REVIEW → APPROVED shortcut (must go through SIGNED)', () => {
    expect(canTransition('IN_REVIEW', 'APPROVED')).toBe(false)
  })

  it('forces IN_REVIEW → SIGNED → APPROVED for staff', () => {
    expect(transition('IN_REVIEW', 'SIGNED', STAFF).ok).toBe(false)
    expect(transition('READY_TO_SIGN', 'SIGNED', CLIENT).ok).toBe(true)
    expect(transition('SIGNED', 'APPROVED', STAFF).ok).toBe(true)
  })

  it('allows READY_TO_SIGN → SIGNING_IN_PROGRESS for staff', () => {
    const result = transition('READY_TO_SIGN', 'SIGNING_IN_PROGRESS', STAFF)
    expect(result.ok).toBe(true)
  })

  it('allows SIGNING_IN_PROGRESS → SIGNED for system (webhook)', () => {
    const result = transition('SIGNING_IN_PROGRESS', 'SIGNED', SYSTEM)
    expect(result.ok).toBe(true)
  })

  it('allows SIGNING_IN_PROGRESS → EXPIRED for system', () => {
    const result = transition('SIGNING_IN_PROGRESS', 'EXPIRED', SYSTEM)
    expect(result.ok).toBe(true)
  })

  it('classifies EXPIRED as terminal', () => {
    expect(isTerminal('EXPIRED')).toBe(true)
  })

  it('classifies SIGNING_IN_PROGRESS as non-terminal', () => {
    expect(isTerminal('SIGNING_IN_PROGRESS')).toBe(false)
  })

  it('blocks transitions from EXPIRED', () => {
    const result = transition('EXPIRED', 'APPROVED', STAFF)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('TERMINAL_STATE')
  })
})

describe('identity helpers', () => {
  it('treats a null identity as incomplete', () => {
    expect(isClientComplete(null)).toBe(false)
    expect(isOwnerComplete(null)).toBe(false)
  })

  it('accepts a fully populated identity', () => {
    const full = {
      fullName: 'Ion Pop',
      idDocument: 'CI XX 000001',
      address: 'Str A',
      email: 'i@p.ro',
      phone: '+40700000000',
    }
    expect(isClientComplete(full)).toBe(true)
    expect(isOwnerComplete(full)).toBe(true)
  })
})

describe('template registry', () => {
  it('returns a template for every known kind', () => {
    expect(getTemplate('brokerage_agreement').kind).toBe('brokerage_agreement')
    expect(getTemplate('owner_mandate').kind).toBe('owner_mandate')
    expect(getTemplate('rental_contract').kind).toBe('rental_contract')
    expect(getTemplate('handover_protocol').kind).toBe('handover_protocol')
    expect(getTemplate('reservation_offer').kind).toBe('reservation_offer')
    expect(getTemplate('viewing_report').kind).toBe('viewing_report')
  })
})

describe('deriveStatusAfterSignature', () => {
  it('returns SIGNED when all required signers have signed', () => {
    expect(deriveStatusAfterSignature({
      current: 'READY_TO_SIGN',
      requiredSigners: 2,
      signedSigners: 2,
    })).toBe('SIGNED')
  })

  it('returns PARTIALLY_SIGNED when only some have signed', () => {
    expect(deriveStatusAfterSignature({
      current: 'READY_TO_SIGN',
      requiredSigners: 2,
      signedSigners: 1,
    })).toBe('PARTIALLY_SIGNED')
  })

  it('returns current status when not in signing states', () => {
    expect(deriveStatusAfterSignature({
      current: 'IN_REVIEW',
      requiredSigners: 2,
      signedSigners: 2,
    })).toBe('IN_REVIEW')
  })
})

describe('cooling-off period', () => {
  it('creates a 14-day period from signed date', () => {
    const signedAt = '2026-07-29T10:00:00Z'
    const co = createCoolingOffPeriod(signedAt)
    expect(co.startedAt).toBe(signedAt)
    expect(co.exercised).toBe(false)
    // 14 days later
    const expiry = new Date(co.expiresAt)
    const start = new Date(signedAt)
    const diffDays = (expiry.getTime() - start.getTime()) / (24 * 60 * 60 * 1_000)
    expect(diffDays).toBe(14)
  })

  it('allows withdrawal within the period', () => {
    const recent = new Date(Date.now() - 60_000).toISOString() // 1 minute ago
    const co = createCoolingOffPeriod(recent)
    expect(canWithdraw(co)).toBe(true)
  })

  it('detects an expired cooling-off period', () => {
    const oldSignedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1_000).toISOString()
    const co = createCoolingOffPeriod(oldSignedAt)
    expect(isCoolingOffExpired(co)).toBe(true)
  })

  it('blocks withdrawal after exercise', () => {
    const recent = new Date(Date.now() - 60_000).toISOString()
    const co = createCoolingOffPeriod(recent)
    const exercised = exerciseWithdrawal(co, 'Changed my mind')
    expect(exercised).not.toBeNull()
    expect(canWithdraw(exercised!)).toBe(false)
    expect(exercised!.reason).toBe('Changed my mind')
  })

  it('returns a status label', () => {
    const recent = new Date(Date.now() - 60_000).toISOString()
    const co = createCoolingOffPeriod(recent)
    const status = getCoolingOffStatus(co)
    expect(status.label).toContain('zile rămase')
  })
})

describe('document expiration', () => {
  it('detects expired documents', () => {
    const doc = createDocument({
      expiresAt: new Date(Date.now() - 1_000).toISOString(), // 1 second ago
    })
    expect(isDocumentExpired(doc)).toBe(true)
  })

  it('does not flag documents without expiration', () => {
    const doc = createDocument({ expiresAt: null })
    expect(isDocumentExpired(doc)).toBe(false)
  })

  it('determines auto-expire eligibility', () => {
    const doc = createDocument({
      status: 'READY_TO_SIGN',
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      expirationAction: 'CANCEL',
    })
    expect(shouldAutoExpire(doc)).toBe(true)
  })

  it('skips auto-expire for terminal documents', () => {
    const doc = createDocument({
      status: 'CANCELLED',
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      expirationAction: 'CANCEL',
    })
    expect(shouldAutoExpire(doc)).toBe(false)
  })

  it('maps expiration action to target status', () => {
    expect(getExpiryTargetStatus('CANCEL')).toBe('EXPIRED')
    expect(getExpiryTargetStatus('SUPERSEDE')).toBe('SUPERSEDED')
    expect(getExpiryTargetStatus('NOTIFY_ONLY')).toBeNull()
  })
})
