import { describe, expect, it } from 'vitest'

import { canAccessAccountPage } from '@/lib/account-roles'
import { getAccountMenuItems, getWorkspaceNavigation } from '@/lib/navigation-config'

describe('owner property navigation', () => {
  it('separates the owner portfolio from the publication form', () => {
    const menu = getAccountMenuItems('OWNER')

    expect(menu.find((item) => item.label === 'Proprietățile mele')?.page).toBe('proprietatile-mele')
    expect(menu.some((item) => item.page === 'adauga-proprietate')).toBe(false)
    expect(getWorkspaceNavigation('OWNER').some((item) => item.page === 'proprietatile-mele')).toBe(true)
  })

  it('keeps the publication action explicit for staff', () => {
    expect(getAccountMenuItems('AGENT').find((item) => item.page === 'adauga-proprietate')?.label).toBe('Adaugă proprietate')
    expect(getAccountMenuItems('ADMIN').find((item) => item.page === 'adauga-proprietate')?.label).toBe('Adaugă proprietate')
  })

  it('limits the private portfolio to owners', () => {
    expect(canAccessAccountPage('OWNER', 'proprietatile-mele')).toBe(true)
    expect(canAccessAccountPage('CLIENT', 'proprietatile-mele')).toBe(false)
    expect(canAccessAccountPage('AGENT', 'proprietatile-mele')).toBe(false)
    expect(canAccessAccountPage('ADMIN', 'proprietatile-mele')).toBe(false)
  })
})
