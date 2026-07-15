import type { StateCreator } from 'zustand'
import type { CoinTransaction, CoinTransactionType, CoinDailyStreak } from '@/lib/types'
import { LS_KEYS } from '@/lib/constants'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'

export interface CoinsSlice {
  ownerId: string | null
  balance: number
  transactions: CoinTransaction[]
  streak: CoinDailyStreak
  earnedPropertyIds: Set<string>

  // Actions
  earnCoins: (type: CoinTransactionType, description: string, relatedId?: string) => number
  spendCoins: (type: CoinTransactionType, description: string, cost: number, relatedId?: string) => boolean
  claimDailyLogin: () => { earned: number; streak: number }
  canAfford: (cost: number) => boolean
  getTransactionHistory: () => CoinTransaction[]
  hasViewedProperty: (propertyId: string) => boolean
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function userCoinKey(key: string, userId: string): string {
  return `${key}:${userId}`
}

export const createCoinsSlice: StateCreator<CoinsSlice> = (set, get) => ({
  ownerId: null,
  balance: 0,
  transactions: [],
  streak: { lastLoginDate: '', currentStreak: 0 },
  earnedPropertyIds: new Set<string>(),

  earnCoins: (type, description, relatedId) => {
    const ownerId = get().ownerId
    if (!ownerId) return 0

    const rule = getCoinAmount(type)
    if (rule <= 0) return 0

    const tx: CoinTransaction = {
      id: generateId(),
      type,
      amount: rule,
      description,
      timestamp: new Date().toISOString(),
      relatedId,
    }

    const newBalance = get().balance + rule
    const newTransactions = [tx, ...get().transactions].slice(0, 200) // keep last 200

    set({ balance: newBalance, transactions: newTransactions })
    saveToLS(userCoinKey(LS_KEYS.COINS_BALANCE, ownerId), newBalance)
    saveToLS(userCoinKey(LS_KEYS.COINS_TRANSACTIONS, ownerId), newTransactions)

    // Dispatch event for badge updates
    window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance: newBalance } }))

    return rule
  },

  spendCoins: (type, description, cost, relatedId) => {
    const ownerId = get().ownerId
    if (!ownerId) return false
    if (get().balance < cost) return false

    const tx: CoinTransaction = {
      id: generateId(),
      type,
      amount: -cost,
      description,
      timestamp: new Date().toISOString(),
      relatedId,
    }

    const newBalance = get().balance - cost
    const newTransactions = [tx, ...get().transactions].slice(0, 200)

    set({ balance: newBalance, transactions: newTransactions })
    saveToLS(userCoinKey(LS_KEYS.COINS_BALANCE, ownerId), newBalance)
    saveToLS(userCoinKey(LS_KEYS.COINS_TRANSACTIONS, ownerId), newTransactions)

    // Track redeemed rewards
    const redeemedKey = userCoinKey(LS_KEYS.COINS_REDEEMED, ownerId)
    const redeemed = loadFromLS<string[]>(redeemedKey, [])
    redeemed.push(tx.id)
    saveToLS(redeemedKey, redeemed)

    window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance: newBalance } }))

    return true
  },

  claimDailyLogin: () => {
    const ownerId = get().ownerId
    if (!ownerId) return { earned: 0, streak: 0 }

    const today = todayStr()
    const streak = { ...get().streak }
    let earned = 0

    if (streak.lastLoginDate === today) {
      return { earned: 0, streak: streak.currentStreak }
    }

    // Check if consecutive day
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    if (streak.lastLoginDate === yesterdayStr) {
      streak.currentStreak += 1
    } else {
      streak.currentStreak = 1
    }

    streak.lastLoginDate = today
    set({ streak })
    saveToLS(userCoinKey(LS_KEYS.COINS_STREAK, ownerId), streak)

    // Base daily reward
    earned = get().earnCoins('daily_login', `Login zilnic (ziua ${streak.currentStreak})`)

    // Streak bonus every 3 days
    if (streak.currentStreak > 0 && streak.currentStreak % 3 === 0) {
      earned += get().earnCoins('daily_streak_bonus', `Bonus streak ${streak.currentStreak} zile consecutive!`)
    }

    return { earned, streak: streak.currentStreak }
  },

  canAfford: (cost) => get().balance >= cost,

  getTransactionHistory: () => get().transactions,

  hasViewedProperty: (propertyId) => get().earnedPropertyIds.has(propertyId),
})

// ─── Helpers ────────────────────────────────────────────────────────

function getCoinAmount(type: CoinTransactionType): number {
  const map: Partial<Record<CoinTransactionType, number>> = {
    daily_login: 5,
    daily_streak_bonus: 10,
    view_property: 1,
    favorite: 3,
    contact_form: 10,
    book_viewing: 15,
    complete_viewing: 25,
    newsletter: 20,
    add_property: 10,
    save_search: 5,
    price_alert: 5,
    admin_bonus: 50,
  }
  return map[type] ?? 0
}

// ─── Hydration (call once on app mount) ─────────────────────────────

export function hydrateCoinsState(
  setter: (partial: Partial<CoinsSlice>) => void,
  userId: string | null,
) {
  if (typeof window === 'undefined') return

  if (!userId) {
    setter({
      ownerId: null,
      balance: 0,
      transactions: [],
      streak: { lastLoginDate: '', currentStreak: 0 },
      earnedPropertyIds: new Set<string>(),
    })
    window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance: 0 } }))
    return
  }

  const balance = loadFromLS<number>(userCoinKey(LS_KEYS.COINS_BALANCE, userId), 0)
  const transactions = loadFromLS<CoinTransaction[]>(userCoinKey(LS_KEYS.COINS_TRANSACTIONS, userId), [])
  const streak = loadFromLS<CoinDailyStreak>(userCoinKey(LS_KEYS.COINS_STREAK, userId), {
    lastLoginDate: '',
    currentStreak: 0,
  })
  setter({ ownerId: userId, balance, transactions, streak, earnedPropertyIds: new Set<string>() })
  window.dispatchEvent(new CustomEvent('pm-coins-updated', { detail: { balance } }))
}
