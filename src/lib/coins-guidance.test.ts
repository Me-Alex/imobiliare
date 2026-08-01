import { describe, expect, it } from 'vitest'

import { getCoinGuidance } from '@/lib/coins-guidance'
import type { CoinReward } from '@/lib/types'

const REWARDS: CoinReward[] = [
  {
    id: 'reward-valuation',
    title: 'Raport Evaluare Premium',
    description: 'Raport detaliat de evaluare.',
    cost: 100,
    icon: 'FileBarChart2',
    category: 'service',
  },
  {
    id: 'reward-featured',
    title: 'Anunț promovat',
    description: 'Promovare pentru proprietate.',
    cost: 500,
    icon: 'Star',
    category: 'listing',
  },
]

describe('getCoinGuidance', () => {
  it('gives clients a simple path from search to viewing', () => {
    const guidance = getCoinGuidance('CLIENT', {
      balance: 0,
      claimedToday: false,
      rewards: REWARDS,
      transactionsCount: 0,
      pendingRedemptions: 0,
      hasError: false,
    })

    expect(guidance.eyebrow).toBe('Portofel client')
    expect(guidance.earningPath.map((step) => step.page)).toContain('programare-vizionare')
    expect(guidance.nextActions[0]?.id).toBe('claim-daily')
    expect(guidance.nextActions.some((action) => action.page === 'proprietati')).toBe(true)
  })

  it('points owners toward property publication before promotion', () => {
    const guidance = getCoinGuidance('OWNER', {
      balance: 40,
      claimedToday: true,
      rewards: REWARDS,
      transactionsCount: 0,
      pendingRedemptions: 0,
      hasError: false,
    })

    expect(guidance.earningPath.map((step) => step.page)).toContain('adauga-proprietate')
    expect(guidance.nextActions.some((action) => action.page === 'adauga-proprietate')).toBe(true)
    expect(guidance.nextActions.some((action) => action.id === 'next-reward')).toBe(true)
  })

  it('sends admins with pending redemptions back to the admin cockpit', () => {
    const guidance = getCoinGuidance('ADMIN', {
      balance: 200,
      claimedToday: true,
      rewards: REWARDS,
      transactionsCount: 5,
      pendingRedemptions: 2,
      hasError: false,
    })

    expect(guidance.nextActions[0]).toMatchObject({
      id: 'pending-redemptions',
      page: 'admin',
    })
    expect(guidance.trustNotes.join(' ')).toContain('auditului intern')
  })
})
