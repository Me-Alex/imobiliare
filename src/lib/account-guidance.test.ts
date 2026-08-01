import { describe, expect, it } from 'vitest'

import { getAccountGuidance, getClientProcessSteps } from '@/lib/account-guidance'

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

describe('getClientProcessSteps', () => {
  it('starts a new client in discovery and keeps later steps pending', () => {
    const steps = getClientProcessSteps(EMPTY)

    expect(steps.map((step) => step.id)).toEqual(['discover', 'viewing', 'deal', 'documents', 'coins'])
    expect(steps[0]).toMatchObject({ id: 'discover', status: 'active', page: 'proprietati' })
    expect(steps.slice(1).every((step) => step.status === 'next')).toBe(true)
  })

  it('moves clients with favorites toward scheduling a viewing', () => {
    const steps = getClientProcessSteps({ ...EMPTY, favorites: 2 })

    expect(steps[0]).toMatchObject({ id: 'discover', status: 'done' })
    expect(steps[1]).toMatchObject({ id: 'viewing', status: 'active', page: 'programare-vizionare' })
  })

  it('sends clients with active viewings to their viewing agenda', () => {
    const steps = getClientProcessSteps({ ...EMPTY, activeViewings: 1 })

    expect(steps[1]).toMatchObject({ id: 'viewing', status: 'active', page: 'vizionarile-mele' })
  })

  it('prioritizes active deals after the viewing stage', () => {
    const steps = getClientProcessSteps({ ...EMPTY, activeDeals: 1 })

    expect(steps[0].status).toBe('done')
    expect(steps[1].status).toBe('done')
    expect(steps[2]).toMatchObject({ id: 'deal', status: 'active', page: 'deal-room' })
  })

  it('makes open document requirements the current client blocker', () => {
    const steps = getClientProcessSteps({ ...EMPTY, activeDeals: 1, openRequirements: 3 })

    expect(steps[2]).toMatchObject({ id: 'deal', status: 'done' })
    expect(steps[3]).toMatchObject({ id: 'documents', status: 'active', page: 'documente' })
    expect(steps[4]).toMatchObject({ id: 'coins', status: 'next' })
  })
})
