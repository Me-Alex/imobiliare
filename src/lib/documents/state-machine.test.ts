import { describe, it, expect } from 'vitest'
import { canTransition, isTerminal, transition } from './state-machine'
import { TEMPLATES_IN_ORDER, getTemplate } from './templates'
import { isClientComplete, isOwnerComplete } from './identity'

const STAFF: import('./types').Actor = { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }
const CLIENT: import('./types').Actor = { kind: 'PARTICIPANT', role: 'CLIENT', userId: 'u_client' }

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
