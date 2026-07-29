import { describe, expect, it } from 'vitest'

import { getAccountGuidance } from '@/lib/account-guidance'

const EMPTY = {
  favorites: 0,
  activeViewings: 0,
  openRequirements: 0,
  propertyCount: 0,
  totalViews: 0,
  leadCount: 0,
  activeDeals: 0,
}

describe('getAccountGuidance', () => {
  it('prioritizes blocked documents for every role', () => {
    for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'] as const) {
      expect(getAccountGuidance(role, { ...EMPTY, openRequirements: 2 }).page).toBe('documente')
    }
  })

  it('guides a new client from discovery toward a viewing', () => {
    expect(getAccountGuidance('CLIENT', EMPTY).page).toBe('proprietati')
    expect(getAccountGuidance('CLIENT', { ...EMPTY, favorites: 3 }).page).toBe('programare-vizionare')
    expect(getAccountGuidance('CLIENT', { ...EMPTY, activeViewings: 1 }).page).toBe('vizionarile-mele')
  })

  it('guides a new owner to publish before showing analytics', () => {
    expect(getAccountGuidance('OWNER', EMPTY).page).toBe('adauga-proprietate')
    expect(getAccountGuidance('OWNER', { ...EMPTY, propertyCount: 1 }).page).toBe('owner-dashboard')
  })

  it('prioritizes operational work for agents and admins', () => {
    expect(getAccountGuidance('AGENT', { ...EMPTY, leadCount: 4 }).page).toBe('crm')
    expect(getAccountGuidance('AGENT', { ...EMPTY, activeViewings: 1, leadCount: 4 }).page).toBe('vizionarile-mele')
    expect(getAccountGuidance('ADMIN', { ...EMPTY, leadCount: 4 }).page).toBe('crm')
    expect(getAccountGuidance('ADMIN', { ...EMPTY, activeDeals: 2 }).page).toBe('deal-room')
  })

  it('does not infer empty-account actions when live data is unavailable', () => {
    expect(getAccountGuidance('OWNER', { ...EMPTY, dataAvailable: false }).page).toBe('owner-dashboard')
    expect(getAccountGuidance('AGENT', { ...EMPTY, dataAvailable: false }).page).toBe('crm')
  })
})
