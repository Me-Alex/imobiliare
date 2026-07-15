'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CircleDollarSign,
  Flame,
  Check,
  ShoppingBag,
  PartyPopper,
  Coins,
  LogIn,
  ShieldCheck,
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
import { useAuth } from '@/contexts/auth-context'
import { COIN_REWARDS, COIN_EARN_RULES } from '@/lib/constants'
import { TransactionRow, RewardCard } from '@/components/monede'
import type { CoinTransaction } from '@/lib/types'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CoinsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Earn rules to show (exclude daily_login & streak_bonus) ───────────────────

const QUICK_EARN_ENTRIES = Object.entries(COIN_EARN_RULES).filter(
  ([key]) => key !== 'daily_login' && key !== 'daily_streak_bonus',
)

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function CoinsPanel({ open, onOpenChange }: CoinsPanelProps) {
  const [claiming, setClaiming] = useState(false)
  const { user, loading } = useAuth()

  const { balance, transactions, streak, spendCoins, canAfford, claimDailyLogin, navigateTo } =
    useAppStore()

  const claimedToday = isTodayClaimed(streak.lastLoginDate)
  const { nextMilestone, progress } = getStreakProgress(streak.currentStreak)

  const handleClaimDaily = () => {
    if (claimedToday) return
    setClaiming(true)
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

  const handleRedeem = (reward: { id: string; title: string; cost: number; duration?: string; value?: string }) => {
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

  if (loading || !user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Coins className="h-5 w-5 text-amber-500" />
              HQS Monede
            </SheetTitle>
            <SheetDescription>
              Portofelul de monede este disponibil numai utilizatorilor autentificati.
            </SheetDescription>
          </SheetHeader>

          <Separator className="mt-2" />

          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <ShieldCheck className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold">
              {loading ? 'Se verifica sesiunea...' : 'Autentifica-te pentru HQS Monede'}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Monedele, istoricul si streak-ul zilnic sunt pastrate separat pentru fiecare cont autentificat.
            </p>
            {!loading && (
              <Button
                className="mt-6 gap-2"
                onClick={() => {
                  onOpenChange(false)
                  navigateTo('login')
                }}
              >
                <LogIn className="h-4 w-4" />
                Autentifica-te cu Google
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

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
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-yellow-300/20 dark:bg-yellow-500/10 blur-2xl" />

                  <div className="relative">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/25">
                      <span className="text-lg font-extrabold text-white tracking-tight">HQS</span>
                    </div>
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
                        <TransactionRow key={tx.id} transaction={tx} variant="bordered" />
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
