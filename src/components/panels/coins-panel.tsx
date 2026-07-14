'use client'

import { useState, useEffect, useRef, createElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  CircleDollarSign,
  Flame,
  Check,
  ShoppingBag,
  Star,
  Sparkles,
  Headphones,
  FileBarChart2,
  Ticket,
  TicketPercent,
  PartyPopper,
  Coins,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/use-app-store'
import { hydrateCoinsState } from '@/store/slices/coins'
import { COIN_REWARDS, COIN_EARN_RULES } from '@/lib/constants'
import type { CoinTransaction, CoinTransactionType } from '@/lib/types'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CoinsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Icon mapping for rewards ──────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Sparkles,
  Headphones,
  FileBarChart2,
  Ticket,
  TicketPercent,
}

// ─── Earn rules to show (exclude daily_login & streak_bonus) ───────────────────

const QUICK_EARN_ENTRIES = Object.entries(COIN_EARN_RULES).filter(
  ([key]) => key !== 'daily_login' && key !== 'daily_streak_bonus',
)

// ─── Category badge colors ────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  listing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  service: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-300 dark:border-violet-700',
  discount: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  listing: 'Anunt',
  service: 'Serviciu',
  discount: 'Reducere',
}

// ─── Streak progress helper ───────────────────────────────────────────────────

function getStreakProgress(streak: number) {
  const milestones = [3, 6, 9, 12, 15, 21, 30]
  const nextMilestone = milestones.find((m) => m > streak) ?? milestones[milestones.length - 1]
  const prevMilestone = streak === 0 ? 0 : milestones.filter((m) => m <= streak).pop() ?? 0
  const progress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  return { nextMilestone, progress: Math.min(100, Math.max(0, progress)) }
}

function isTodayClaimed(lastLoginDate: string): boolean {
  if (!lastLoginDate) return false
  return lastLoginDate === new Date().toISOString().slice(0, 10)
}

// ─── Relative time formatter ──────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), {
    addSuffix: true,
    locale: ro,
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CoinsPanel({ open, onOpenChange }: CoinsPanelProps) {
  const hydrated = useRef(false)
  const [claiming, setClaiming] = useState(false)

  const { balance, transactions, streak, earnCoins, spendCoins, canAfford, claimDailyLogin } =
    useAppStore()

  // Hydrate coins state from localStorage on first open
  useEffect(() => {
    if (open && !hydrated.current) {
      hydrated.current = true
      useAppStore.setState((s) => {
        hydrateCoinsState((partial) => {
          Object.assign(s, partial)
        })
      })
    }
  }, [open])

  const claimedToday = isTodayClaimed(streak.lastLoginDate)
  const { nextMilestone, progress } = getStreakProgress(streak.currentStreak)

  const handleClaimDaily = () => {
    if (claimedToday) return
    setClaiming(true)
    // Small delay for visual feedback
    setTimeout(() => {
      const result = claimDailyLogin()
      setClaiming(false)
      if (result.earned > 0) {
        toast.success(`+${result.earned} monede primite!`, {
          description:
            streak.currentStreak > 0 && streak.currentStreak % 3 === 0
              ? `Bonus streak la ${streak.currentStreak} zile!`
              : 'Login zilnic revendicat.',
        })
      }
    }, 300)
  }

  const handleRedeem = (reward: CoinReward) => {
    if (!canAfford(reward.cost)) {
      const deficit = reward.cost - balance
      toast.error(`Nu ai suficiente monede. Mai ai nevoie de ${deficit} monede.`)
      return
    }

    const txTypeMap: Record<string, CoinTransaction['type']> = {
      'reward-featured-7': 'reward_featured',
      'reward-highlight-30': 'reward_highlight',
      'reward-priority': 'reward_priority',
      'reward-valuation': 'reward_valuation',
      'reward-voucher-5': 'reward_voucher_5',
      'reward-voucher-10': 'reward_voucher_10',
    }

    const txType = txTypeMap[reward.id] ?? 'reward_featured'
    const success = spendCoins(txType, `Redemare: ${reward.title}`, reward.cost, reward.id)

    if (success) {
      toast.success(`${reward.title} redemat cu succes!`, {
        description: `-${reward.cost} monede. Bucura-te de ${reward.duration ?? reward.value ?? 'avantajul tau'}!`,
        icon: <PartyPopper className="h-5 w-5 text-amber-500" />,
      })
    }
  }

  // Animate balance changes
  const [displayBalance, setDisplayBalance] = useState(balance)
  useEffect(() => {
    const timer = setTimeout(() => setDisplayBalance(balance), 50)
    return () => clearTimeout(timer)
  }, [balance])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-amber-500" />
            HQS Monede
          </SheetTitle>
          <SheetDescription>
            Castiga monede si schimba-le pe recompense
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-2" />

        <Tabs defaultValue="coins" className="flex-1 flex flex-col mt-2">
          <div className="px-6">
            <TabsList className="w-full h-10">
              <TabsTrigger value="coins" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <CircleDollarSign className="size-3.5" />
                Monede
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <History className="size-3.5" />
                Istoric
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <ShoppingBag className="size-3.5" />
                Magazin
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tab 1: Coins Overview ── */}
          <TabsContent value="coins" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(80vh-10rem)]">
              <div className="px-6 py-4 space-y-6">
                {/* Balance Hero */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="relative rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-800/40 p-6 text-center overflow-hidden"
                >
                  {/* Decorative glow */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-yellow-300/20 dark:bg-yellow-500/10 blur-2xl" />

                  <div className="relative">
                    {/* Coin icon */}
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/25">
                      <span className="text-lg font-extrabold text-white tracking-tight">HQS</span>
                    </div>

                    {/* Balance */}
                    <p className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-400 dark:via-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                      {displayBalance.toLocaleString('ro-RO')}
                    </p>
                    <p className="text-sm text-amber-700/70 dark:text-amber-400/70 font-medium mt-1">
                      HQS Monede
                    </p>
                  </div>
                </motion.div>

                {/* Daily Streak */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Streak zilnic
                    </h3>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {streak.currentStreak > 0 ? (
                        <>
                          {streak.currentStreak} {streak.currentStreak === 1 ? 'zi' : 'zile'} consecutive
                        </>
                      ) : (
                        'Incepe acum'
                      )}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {streak.currentStreak > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progres</span>
                        <span>Urmatorul bonus la {nextMilestone} zile</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Claim button */}
                  {claimedToday ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      Revendicat astazi
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
                      onClick={handleClaimDaily}
                      disabled={claiming}
                    >
                      {claiming ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <CircleDollarSign className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <CircleDollarSign className="h-4 w-4" />
                      )}
                      {claiming ? 'Se revendica...' : `Revendica (+${COIN_EARN_RULES.daily_login.coins} monede)`}
                    </Button>
                  )}
                </div>

                {/* Quick Earn Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Cum sa castigi monede
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_EARN_ENTRIES.map(([key, rule]) => (
                      <EarnActionItem key={key} label={rule.label} coins={rule.coins} description={rule.description} />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Tab 2: Transaction History ── */}
          <TabsContent value="history" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(80vh-10rem)]">
              <div className="px-6 py-4">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                      <CircleDollarSign className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Nicio tranzactie</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Inca nu ai nicio tranzactie. Castiga monede vizualizand proprietati, salvand favorite si multe altele!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {transactions.map((tx) => (
                        <TransactionRow key={tx.id} transaction={tx} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Tab 3: Rewards Shop ── */}
          <TabsContent value="shop" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(80vh-10rem)]">
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COIN_REWARDS.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      canAfford={canAfford(reward.cost)}
                      balance={balance}
                      onRedeem={() => handleRedeem(reward)}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

// ─── Earn Action Item ──────────────────────────────────────────────────────────

function EarnActionItem({
  label,
  coins,
  description,
}: {
  label: string
  coins: number
  description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <CircleDollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
      </div>
      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">
        +{coins}
      </span>
    </motion.div>
  )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ transaction }: { transaction: CoinTransaction }) {
  const isEarned = transaction.amount > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
    >
      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isEarned
            ? 'bg-emerald-100 dark:bg-emerald-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}
      >
        {isEarned ? (
          <CircleDollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ShoppingBag className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{transaction.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(transaction.timestamp)}
        </p>
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-bold shrink-0 ${
          isEarned
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isEarned ? '+' : ''}{transaction.amount}
      </span>
    </motion.div>
  )
}

// ─── Reward Card ──────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  canAfford,
  balance,
  onRedeem,
}: {
  reward: CoinReward
  canAfford: boolean
  balance: number
  onRedeem: () => void
}) {
  const [redeeming, setRedeeming] = useState(false)
  const [justRedeemed, setJustRedeemed] = useState(false)
  const deficit = reward.cost - balance

  const handleRedeem = () => {
    setRedeeming(true)
    setTimeout(() => {
      onRedeem()
      setRedeeming(false)
      setJustRedeemed(true)
      setTimeout(() => setJustRedeemed(false), 1500)
    }, 400)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(justRedeemed
          ? {
              scale: [1, 1.05, 1],
              transition: { duration: 0.5 },
            }
          : {}),
      }}
      className={`relative flex flex-col rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${
        justRedeemed ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            {createElement(ICON_MAP[reward.icon] ?? CircleDollarSign, { className: 'h-5 w-5 text-amber-600 dark:text-amber-400' })}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold leading-tight">{reward.title}</h4>
            <Badge
              variant="outline"
              className={`mt-1 text-[10px] font-medium ${CATEGORY_STYLES[reward.category] ?? ''}`}
            >
              {CATEGORY_LABELS[reward.category] ?? reward.category}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {reward.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-auto">
          {reward.duration && (
            <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
              {reward.duration}
            </span>
          )}
          {reward.value && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md px-2 py-0.5">
              {reward.value}
            </span>
          )}
        </div>

        {/* Redeem button */}
        {canAfford ? (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              className="w-full h-9 gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 text-xs font-semibold"
              onClick={handleRedeem}
              disabled={redeeming || justRedeemed}
            >
              {redeeming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Coins className="h-3.5 w-3.5" />
                </motion.div>
              ) : justRedeemed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <CircleDollarSign className="h-3.5 w-3.5" />
              )}
              {redeeming
                ? 'Se proceseaza...'
                : justRedeemed
                  ? 'Redemat!'
                  : `Redeema — ${reward.cost} monede`}
            </Button>
          </motion.div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 text-xs text-muted-foreground cursor-not-allowed"
            disabled
          >
            <CircleDollarSign className="h-3.5 w-3.5 opacity-50" />
            Nu ai suficiente monede ({deficit} in plus)
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// ─── History icon (for tab label) ─────────────────────────────────────────────

function History({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}