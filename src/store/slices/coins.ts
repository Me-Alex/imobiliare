import type { StateCreator } from 'zustand'
import type {
  CoinAccountSnapshot,
  CoinDailyStreak,
  CoinRedemption,
  CoinReward,
  CoinTransaction,
  CoinTransactionType,
} from '@/lib/types'
import {
  awardCoinAction,
  claimDailyCoinReward,
  fetchCoinAccount,
  redeemCoinReward,
} from '@/lib/coins-api'

export interface CoinsSlice {
  ownerId: string | null
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  transactions: CoinTransaction[]
  rewards: CoinReward[]
  redemptions: CoinRedemption[]
  streak: CoinDailyStreak
  earnedPropertyIds: Set<string>
  coinsLoading: boolean
  coinsError: string | null

  hydrateCoins: (userId: string | null) => Promise<void>
  refreshCoins: () => Promise<void>
  earnCoins: (type: CoinTransactionType, description: string, relatedId?: string) => Promise<number>
  claimDailyLogin: () => Promise<{ earned: number; streak: number }>
  redeemReward: (rewardId: string) => Promise<CoinRedemption | null>
  canAfford: (cost: number) => boolean
  hasViewedProperty: (propertyId: string) => boolean
}

const emptyCoinState = {
  balance: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  transactions: [] as CoinTransaction[],
  rewards: [] as CoinReward[],
  redemptions: [] as CoinRedemption[],
  streak: { lastLoginDate: '', currentStreak: 0 },
  earnedPropertyIds: new Set<string>(),
  coinsError: null,
}

function snapshotState(snapshot: CoinAccountSnapshot) {
  const earnedPropertyIds = new Set(
    snapshot.transactions
      .filter((transaction) => transaction.type === 'view_property' && transaction.relatedId)
      .map((transaction) => transaction.relatedId as string),
  )

  return {
    balance: snapshot.wallet.balance,
    lifetimeEarned: snapshot.wallet.lifetimeEarned,
    lifetimeSpent: snapshot.wallet.lifetimeSpent,
    transactions: snapshot.transactions,
    rewards: snapshot.rewards,
    redemptions: snapshot.redemptions,
    streak: {
      lastLoginDate: snapshot.wallet.lastClaimDate,
      currentStreak: snapshot.wallet.currentStreak,
    },
    earnedPropertyIds,
    coinsError: null,
  }
}

function dispatchBalance(balance: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance } }))
  }
}

export const createCoinsSlice: StateCreator<CoinsSlice> = (set, get) => ({
  ownerId: null,
  ...emptyCoinState,
  coinsLoading: false,

  hydrateCoins: async (userId) => {
    if (!userId) {
      set({ ownerId: null, ...emptyCoinState, coinsLoading: false })
      dispatchBalance(0)
      return
    }

    set({ ownerId: userId, coinsLoading: true, coinsError: null })
    try {
      const snapshot = await fetchCoinAccount()
      if (get().ownerId !== userId) return
      set({ ...snapshotState(snapshot), coinsLoading: false })
      dispatchBalance(snapshot.wallet.balance)
    } catch (error) {
      if (get().ownerId !== userId) return
      set({
        coinsLoading: false,
        coinsError: error instanceof Error ? error.message : 'HQS Monede este indisponibil.',
      })
    }
  },

  refreshCoins: async () => {
    const ownerId = get().ownerId
    if (!ownerId) return
    await get().hydrateCoins(ownerId)
  },

  earnCoins: async (type, description, relatedId) => {
    if (!get().ownerId) return 0
    const snapshot = await awardCoinAction(type, description, relatedId)
    set(snapshotState(snapshot))
    dispatchBalance(snapshot.wallet.balance)
    return snapshot.earned ?? 0
  },

  claimDailyLogin: async () => {
    if (!get().ownerId) return { earned: 0, streak: 0 }
    const snapshot = await claimDailyCoinReward()
    set(snapshotState(snapshot))
    dispatchBalance(snapshot.wallet.balance)
    return {
      earned: snapshot.earned ?? 0,
      streak: snapshot.wallet.currentStreak,
    }
  },

  redeemReward: async (rewardId) => {
    if (!get().ownerId) return null
    const snapshot = await redeemCoinReward(rewardId)
    set(snapshotState(snapshot))
    dispatchBalance(snapshot.wallet.balance)
    return snapshot.redemptions.find((item) => item.id === snapshot.redemptionId) ?? null
  },

  canAfford: (cost) => get().balance >= cost,
  hasViewedProperty: (propertyId) => get().earnedPropertyIds.has(propertyId),
})
