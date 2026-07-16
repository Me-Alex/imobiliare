import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  CoinAccountSnapshot,
  CoinRedemption,
  CoinRedemptionStatus,
  CoinReward,
  CoinTransaction,
  CoinTransactionType,
} from '@/lib/types'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function mapTransaction(value: unknown): CoinTransaction {
  const row = asRecord(value)
  return {
    id: asString(row.id),
    type: asString(row.type) as CoinTransactionType,
    amount: asNumber(row.amount),
    balanceAfter: asNumber(row.balanceAfter),
    description: asString(row.description),
    timestamp: asString(row.timestamp),
    relatedId: asString(row.relatedId) || undefined,
  }
}

function mapReward(value: unknown): CoinReward {
  const row = asRecord(value)
  const category = asString(row.category)
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asString(row.description),
    cost: asNumber(row.cost),
    icon: asString(row.icon),
    category: category === 'listing' || category === 'discount' ? category : 'service',
    duration: asString(row.duration) || undefined,
    value: asString(row.value) || undefined,
  }
}

function mapRedemption(value: unknown): CoinRedemption {
  const row = asRecord(value)
  return {
    id: asString(row.id),
    rewardId: asString(row.rewardId),
    title: asString(row.title),
    cost: asNumber(row.cost),
    status: asString(row.status) as CoinRedemptionStatus,
    requestedAt: asString(row.requestedAt),
    resolvedAt: asString(row.resolvedAt) || undefined,
    resolutionNote: asString(row.resolutionNote) || undefined,
  }
}

function mapSnapshot(value: unknown): CoinAccountSnapshot {
  const root = asRecord(value)
  const wallet = asRecord(root.wallet)
  return {
    wallet: {
      balance: asNumber(wallet.balance),
      lifetimeEarned: asNumber(wallet.lifetimeEarned),
      lifetimeSpent: asNumber(wallet.lifetimeSpent),
      currentStreak: asNumber(wallet.currentStreak),
      lastClaimDate: asString(wallet.lastClaimDate),
    },
    transactions: Array.isArray(root.transactions) ? root.transactions.map(mapTransaction) : [],
    rewards: Array.isArray(root.rewards) ? root.rewards.map(mapReward) : [],
    redemptions: Array.isArray(root.redemptions) ? root.redemptions.map(mapRedemption) : [],
    earned: typeof root.earned === 'number' ? root.earned : undefined,
    alreadyClaimed: typeof root.alreadyClaimed === 'boolean' ? root.alreadyClaimed : undefined,
    reason: root.reason === 'awarded' || root.reason === 'duplicate' || root.reason === 'daily_limit'
      ? root.reason
      : undefined,
    redemptionId: asString(root.redemptionId) || undefined,
  }
}

function ensureConfigured() {
  if (!isSupabaseConfigured) throw new Error('Serviciul HQS Monede nu este configurat.')
}

function throwRpcError(error: { message?: string } | null) {
  const code = error?.message || ''
  if (code.includes('INSUFFICIENT_COINS')) throw new Error('Nu ai suficiente monede pentru această recompensă.')
  if (code.includes('COIN_PROFILE_REQUIRED')) throw new Error('Profilul tău trebuie activat înainte de a folosi HQS Monede.')
  if (code.includes('VALID_PROPERTY_REQUIRED')) throw new Error('Proprietatea nu a putut fi validată pentru recompensă.')
  throw new Error('HQS Monede este momentan indisponibil. Încearcă din nou.')
}

export async function fetchCoinAccount(): Promise<CoinAccountSnapshot> {
  ensureConfigured()
  const { data, error } = await supabase.rpc('get_coin_account')
  if (error) throwRpcError(error)
  return mapSnapshot(data)
}

export async function claimDailyCoinReward(): Promise<CoinAccountSnapshot> {
  ensureConfigured()
  const { data, error } = await supabase.rpc('claim_daily_coin_reward')
  if (error) throwRpcError(error)
  return mapSnapshot(data)
}

export async function awardCoinAction(
  action: CoinTransactionType,
  description: string,
  relatedId?: string,
): Promise<CoinAccountSnapshot> {
  ensureConfigured()
  const { data, error } = await supabase.rpc('award_coin_action', {
    p_action: action,
    p_related_id: relatedId ?? null,
    p_description: description,
  })
  if (error) throwRpcError(error)
  return mapSnapshot(data)
}

export async function redeemCoinReward(rewardId: string): Promise<CoinAccountSnapshot> {
  ensureConfigured()
  const { data, error } = await supabase.rpc('redeem_coin_reward', { p_reward_id: rewardId })
  if (error) throwRpcError(error)
  return mapSnapshot(data)
}
