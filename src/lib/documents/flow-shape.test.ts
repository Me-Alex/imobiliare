import { describe, it, expect } from 'vitest'
import {
  RENTAL_SHAPE,
  SALE_SHAPE,
  activeSaleStage,
  getTransactionShape,
} from './flow-shape'
import type { ClientField } from './flow-shape'

function validateRequiredFilled(
  fields: readonly ClientField[],
  values: Record<string, unknown>,
): { ok: boolean; missing: string[] } {
  const missing: string[] = []
  for (const f of fields) {
    if (!f.required) continue
    const v = values[f.key]
    if (v === undefined || v === null || v === '') missing.push(f.key)
  }
  return { ok: missing.length === 0, missing }
}

describe('RENTAL shape', () => {
  it('declares exactly one document (viewing_report) and 9 fields', () => {
    expect(RENTAL_SHAPE.kind).toBe('RENTAL')
    expect(RENTAL_SHAPE.documentKind).toBe('viewing_report')
    expect(RENTAL_SHAPE.fields).toHaveLength(9)
  })

  it('validates a complete rental submission', () => {
    const values = {
      fullName: 'Ion Pop',
      idDocument: 'CI XX 000001',
      address: 'Str. A',
      email: 'i@p.ro',
      phone: '+40700000000',
      moveInDate: '2026-09-01',
      occupants: 2,
      hasPets: false,
    }
    expect(validateRequiredFilled(RENTAL_SHAPE.fields, values).ok).toBe(true)
  })

  it('rejects a submission missing the required contact fields', () => {
    const values = { fullName: 'Ion Pop' }
    const result = validateRequiredFilled(RENTAL_SHAPE.fields, values)
    expect(result.ok).toBe(false)
    expect(result.missing).toContain('email')
    expect(result.missing).toContain('phone')
    expect(result.missing).toContain('moveInDate')
  })
})

describe('SALE shape', () => {
  it('declares three progressive stages', () => {
    expect(SALE_SHAPE.kind).toBe('SALE')
    expect(SALE_SHAPE.stages).toHaveLength(3)
    expect(SALE_SHAPE.stages.map((s) => s.id)).toEqual(['identity', 'offer', 'contract'])
  })

  it('chains stages — each unlocks the next', () => {
    expect(SALE_SHAPE.stages[0]!.unlocks).toBe('offer')
    expect(SALE_SHAPE.stages[1]!.unlocks).toBe('contract')
    expect(SALE_SHAPE.stages[2]!.unlocks).toBeNull()
  })

  it('returns the first un-completed stage as active', () => {
    expect(activeSaleStage(SALE_SHAPE, []).id).toBe('identity')
    expect(activeSaleStage(SALE_SHAPE, ['identity']).id).toBe('offer')
    expect(activeSaleStage(SALE_SHAPE, ['identity', 'offer']).id).toBe('contract')
  })

  it('falls back to the last stage when everything is done', () => {
    expect(activeSaleStage(SALE_SHAPE, ['identity', 'offer', 'contract']).id).toBe('contract')
  })

  it('the identity stage requires financing and budgetMax', () => {
    const identity = SALE_SHAPE.stages.find((s) => s.id === 'identity')!
    const incomplete = validateRequiredFilled(identity.fields, { fullName: 'X' })
    expect(incomplete.ok).toBe(false)
    expect(incomplete.missing).toContain('financing')
    expect(incomplete.missing).toContain('budgetMax')
  })
})

describe('getTransactionShape', () => {
  it('returns the rental shape', () => {
    expect(getTransactionShape('RENTAL').kind).toBe('RENTAL')
  })

  it('returns the sale shape', () => {
    expect(getTransactionShape('SALE').kind).toBe('SALE')
  })
})
