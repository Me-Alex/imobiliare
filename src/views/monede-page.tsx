'use client'

import { useState, useEffect, useMemo, createElement, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  Coins,
  CircleDollarSign,
  Flame,
  Check,
  ShoppingBag,
  Star,
  Sparkles,
  PartyPopper,
  LogIn,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Award,
  Footprints,
  Gem,
  Crown,
  Eye,
  Compass,
  Heart,
  CalendarCheck,
  Search,
  Unlock,
  ChevronRight,
  Zap,
  Target,
  Medal,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/store/use-app-store'
import { useAuth } from '@/contexts/auth-context'
import {
  COIN_REWARDS,
  COIN_EARN_RULES,
  COIN_ACHIEVEMENTS,
  ACHIEVEMENT_TIER_STYLES,
  MOCK_LEADERBOARD,
  LS_KEYS,
} from '@/lib/constants'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { TransactionRow, RewardCard } from '@/components/monede'
import type {
  CoinReward,
  CoinTransaction,
  CoinAchievement,
  LeaderboardEntry,
  WeeklyChallenge,
  CoinTransactionType,
} from '@/lib/types'

// ─── Icon map for achievements ─────────────────────────────────────────────────

const ACHIEVEMENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  Gem,
  Crown,
  Trophy,
  Flame,
  Award,
  Eye,
  Compass,
  Heart,
  Star,
  CalendarCheck,
  Search,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function formatTimestamp(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: ro })
}

function userCoinKey(key: string, userId: string): string {
  return `${key}:${userId}`
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ─── Default weekly challenges ─────────────────────────────────────────────────

function getDefaultChallenges(): WeeklyChallenge[] {
  const weekStart = getWeekStart(new Date())
  return [
    {
      id: 'ch-view-5',
      title: 'Explorator',
      description: 'Vizualizeaza 5 proprietati',
      icon: 'Eye',
      target: 5,
      current: 0,
      reward: 15,
      type: 'view_properties',
      weekStart,
      completed: false,
      claimed: false,
    },
    {
      id: 'ch-favorite-3',
      title: 'Colectionar',
      description: 'Adauga 3 proprietati la favorite',
      icon: 'Heart',
      target: 3,
      current: 0,
      reward: 20,
      type: 'save_favorites',
      weekStart,
      completed: false,
      claimed: false,
    },
    {
      id: 'ch-book-viewing',
      title: 'Planificator',
      description: 'Programeaza o vizionare',
      icon: 'CalendarCheck',
      target: 1,
      current: 0,
      reward: 25,
      type: 'book_viewings',
      weekStart,
      completed: false,
      claimed: false,
    },
    {
      id: 'ch-save-search',
      title: 'Organizat',
      description: 'Salveaza o cautare',
      icon: 'Search',
      target: 1,
      current: 0,
      reward: 15,
      type: 'share_search',
      weekStart,
      completed: false,
      claimed: false,
    },
  ]
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function MonedePage() {
  const { user, loading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] animate-pulse bg-muted/10 flex items-center justify-center">
        <Coins className="h-8 w-8 text-amber-500 animate-bounce" />
      </div>
    )
  }

  if (!user) {
    return <MonedeGuestState onLogin={() => navigateTo('login')} />
  }

  return <MonedeAuthenticatedPage />
}

// ─── Guest State ───────────────────────────────────────────────────────────────

function MonedeGuestState({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <ShieldCheck className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HQS Monede</h1>
          <p className="mt-2 text-muted-foreground">
            Sistemul de loialitate HQS iti ofera monede pentru activitatea pe platforma.
            Schimba-le pe recompense exclusive!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="glass-card rounded-xl p-4 space-y-1">
            <Coins className="h-5 w-5 text-amber-500" />
            <p className="font-semibold text-sm">Castiga monede</p>
            <p className="text-xs text-muted-foreground">Pentru vizualizari, favorite si vizionari</p>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-1">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="font-semibold text-sm">Realizari</p>
            <p className="text-xs text-muted-foreground">Deblocheaza badge-uri si bonusuri</p>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-1">
            <Zap className="h-5 w-5 text-amber-500" />
            <p className="font-semibold text-sm">Provocari saptamanale</p>
            <p className="text-xs text-muted-foreground">Completeaza misiuni pentru premii extra</p>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-1">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            <p className="font-semibold text-sm">Magazin recompense</p>
            <p className="text-xs text-muted-foreground">Schimba monedele pe avantaje reale</p>
          </div>
        </div>

        <Button onClick={onLogin} className="gap-2 w-full sm:w-auto">
          <LogIn className="h-4 w-4" />
          Autentifica-te pentru a incepe
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Authenticated Page ────────────────────────────────────────────────────────

function MonedeAuthenticatedPage() {
  const { user, profile } = useAuth()
  const {
    balance,
    transactions,
    streak,
    spendCoins,
    canAfford,
    claimDailyLogin,
    earnCoins,
  } = useAppStore()

  const userId = user?.id ?? ''
  const [displayBalance, setDisplayBalance] = useState(balance)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayBalance(balance), 50)
    return () => clearTimeout(timer)
  }, [balance])

  // ─── Achievements state ─────────────────────────────────────────────────────
  const [achievements, setAchievements] = useState<Record<string, { progress: number; unlockedAt: string | null }>>({})

  useEffect(() => {
    if (!userId) return
    const saved = loadFromLS<Record<string, { progress: number; unlockedAt: string | null }>>(
      userCoinKey(LS_KEYS.COINS_ACHIEVEMENTS, userId),
      {},
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAchievements(saved)
  }, [userId])

  const saveAchievements = useCallback(
    (next: Record<string, { progress: number; unlockedAt: string | null }>) => {
      setAchievements(next)
      if (userId) saveToLS(userCoinKey(LS_KEYS.COINS_ACHIEVEMENTS, userId), next)
    },
    [userId],
  )

  // Compute achievement progress from transactions
  const computedAchievements = useMemo(() => {
    const totalEarned = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const viewCount = transactions.filter((t) => t.type === 'view_property').length
    const favCount = transactions.filter((t) => t.type === 'favorite').length
    const viewingCount = transactions.filter((t) => t.type === 'book_viewing').length
    const searchCount = transactions.filter((t) => t.type === 'save_search').length

    const metrics: Record<string, number> = {
      total_earned: totalEarned,
      streak_days: streak.currentStreak,
      properties_viewed: viewCount,
      favorites: favCount,
      viewings_booked: viewingCount,
      searches_saved: searchCount,
    }

    return COIN_ACHIEVEMENTS.map((ach) => {
      const saved = achievements[ach.id]
      const progress = Math.min(metrics[ach.metric] ?? 0, ach.target)
      const unlocked = saved?.unlockedAt || (progress >= ach.target ? new Date().toISOString() : null)
      return { ...ach, progress, unlockedAt: unlocked }
    })
  }, [transactions, streak, achievements])

  // Auto-unlock achievements
  useEffect(() => {
    const next: Record<string, { progress: number; unlockedAt: string | null }> = { ...achievements }
    let changed = false
    computedAchievements.forEach((ach) => {
      const existing = achievements[ach.id]
      const wasUnlocked = existing?.unlockedAt != null
      if (ach.progress >= ach.target && !wasUnlocked) {
        next[ach.id] = { progress: ach.progress, unlockedAt: new Date().toISOString() }
        changed = true
        toast.success(`🏆 Realizare deblocata: ${ach.title}!`, {
          description: `+${ach.reward} monede bonus`,
          icon: <Award className="h-5 w-5 text-amber-500" />,
        })
        earnCoins('admin_bonus' as CoinTransactionType, `Realizare: ${ach.title}`, undefined)
      } else if (!existing || existing.progress !== ach.progress) {
        next[ach.id] = { progress: ach.progress, unlockedAt: existing?.unlockedAt ?? null }
        changed = true
      }
    })
    if (changed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      saveAchievements(next)
    }
  }, [computedAchievements])

  // ─── Challenges state ───────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])

  useEffect(() => {
    if (!userId) return
    const saved = loadFromLS<WeeklyChallenge[]>(userCoinKey(LS_KEYS.COINS_CHALLENGES, userId), [])
    const currentWeek = getWeekStart(new Date())
    const valid = saved.filter((c) => c.weekStart === currentWeek)
    if (valid.length === 0) {
      const fresh = getDefaultChallenges()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChallenges(fresh)
      saveToLS(userCoinKey(LS_KEYS.COINS_CHALLENGES, userId), fresh)
    } else {
      setChallenges(valid)
    }
  }, [userId])

  const updateChallengeProgress = useCallback(
    (challengeId: string, increment: number) => {
      setChallenges((prev) => {
        const next = prev.map((c) => {
          if (c.id !== challengeId) return c
          const newCurrent = Math.min(c.target, c.current + increment)
          return { ...c, current: newCurrent, completed: newCurrent >= c.target }
        })
        if (userId) saveToLS(userCoinKey(LS_KEYS.COINS_CHALLENGES, userId), next)
        return next
      })
    },
    [userId],
  )

  const claimChallenge = useCallback(
    (challenge: WeeklyChallenge) => {
      if (!challenge.completed || challenge.claimed) return
      const earned = earnCoins('admin_bonus' as CoinTransactionType, `Provocare: ${challenge.title}`, challenge.id)
      if (earned > 0) {
        toast.success(`+${challenge.reward} monede!`, {
          description: `Provocare completata: ${challenge.title}`,
        })
      }
      setChallenges((prev) => {
        const next = prev.map((c) => (c.id === challenge.id ? { ...c, claimed: true } : c))
        if (userId) saveToLS(userCoinKey(LS_KEYS.COINS_CHALLENGES, userId), next)
        return next
      })
    },
    [earnCoins, userId],
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleClaimDaily = () => {
    if (streak.lastLoginDate === todayStr()) return
    setClaiming(true)
    setTimeout(() => {
      const result = claimDailyLogin()
      setClaiming(false)
      if (result.earned > 0) {
        toast.success(`+${result.earned} monede primite!`, {
          description: result.streak > 0 && result.streak % 3 === 0
            ? `Bonus streak la ${result.streak} zile!`
            : 'Login zilnic revendicat.',
        })
      }
    }, 300)
  }

  const handleRedeem = (reward: CoinReward) => {
    if (!canAfford(reward.cost)) {
      toast.error(`Nu ai suficiente monede. Mai ai nevoie de ${reward.cost - balance} monede.`)
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
    const success = spendCoins(txTypeMap[reward.id] ?? 'reward_featured', `Redemare: ${reward.title}`, reward.cost, reward.id)
    if (success) {
      toast.success(`${reward.title} redemat cu succes!`, {
        description: `-${reward.cost} monede. Bucura-te de ${reward.duration ?? reward.value ?? 'avantajul tau'}!`,
        icon: <PartyPopper className="h-5 w-5 text-amber-500" />,
      })
    }
  }

  // ─── Leaderboard with current user ──────────────────────────────────────────
  const leaderboard = useMemo(() => {
    const userEntry: LeaderboardEntry = {
      rank: 0,
      name: profile?.fullName || user?.email?.split('@')[0] || 'Tu',
      initials: (profile?.fullName || user?.email || 'U').slice(0, 2).toUpperCase(),
      balance,
      streak: streak.currentStreak,
      isCurrentUser: true,
    }
    const all = [...MOCK_LEADERBOARD, userEntry]
      .sort((a, b) => b.balance - a.balance)
      .map((e, i) => ({ ...e, rank: i + 1 }))
    return all.slice(0, 10)
  }, [balance, streak, profile, user])

  const claimedToday = streak.lastLoginDate === todayStr()
  const last7Days = getLast7Days()

  return (
    <div className="min-h-screen pb-12">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 dots-pattern opacity-50" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-xl shadow-amber-400/20">
              <span className="text-2xl font-extrabold text-white tracking-tight">HQS</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-400 dark:via-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
              {displayBalance.toLocaleString('ro-RO')}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground font-medium">
              HQS Monede
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Streak: {streak.currentStreak} zile
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                {computedAchievements.filter((a) => a.unlockedAt).length} realizari
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                {transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)} total castigat
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="panou" className="space-y-8">
          <TabsList className="w-full h-12 bg-muted/50 p-1">
            <TabsTrigger value="panou" className="flex-1 gap-1.5 text-sm">
              <Zap className="h-4 w-4" />
              Panou
            </TabsTrigger>
            <TabsTrigger value="realizari" className="flex-1 gap-1.5 text-sm">
              <Award className="h-4 w-4" />
              Realizari
            </TabsTrigger>
            <TabsTrigger value="provocari" className="flex-1 gap-1.5 text-sm">
              <Target className="h-4 w-4" />
              Provocari
            </TabsTrigger>
            <TabsTrigger value="clasament" className="flex-1 gap-1.5 text-sm">
              <Medal className="h-4 w-4" />
              Clasament
            </TabsTrigger>
            <TabsTrigger value="magazin" className="flex-1 gap-1.5 text-sm">
              <ShoppingBag className="h-4 w-4" />
              Magazin
            </TabsTrigger>
            <TabsTrigger value="istoric" className="flex-1 gap-1.5 text-sm">
              <Calendar className="h-4 w-4" />
              Istoric
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Panou ── */}
          <TabsContent value="panou" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Streak Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6 lg:col-span-1"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold">Streak zilnic</h2>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">{streak.currentStreak}</p>
                    <p className="text-sm text-muted-foreground">zile consecutive</p>
                  </div>
                  {claimedToday ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      Revendicat
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
                      onClick={handleClaimDaily}
                      disabled={claiming}
                    >
                      {claiming ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <CircleDollarSign className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <CircleDollarSign className="h-4 w-4" />
                      )}
                      Revendica +5
                    </Button>
                  )}
                </div>

                {/* 7-day mini calendar */}
                <div className="flex items-center justify-between gap-1">
                  {last7Days.map((day) => {
                    const isClaimed = day === streak.lastLoginDate ||
                      (transactions.some((t) => t.type === 'daily_login' && t.timestamp.startsWith(day)))
                    const isFuture = day > todayStr()
                    const dayName = new Date(day).toLocaleDateString('ro-RO', { weekday: 'narrow' })
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase">{dayName}</span>
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isClaimed
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                              : isFuture
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30'
                          }`}
                        >
                          {isClaimed ? <Check className="h-3.5 w-3.5" /> : new Date(day).getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Cum sa castigi</h3>
                  {Object.entries(COIN_EARN_RULES)
                    .filter(([key]) => key !== 'daily_login' && key !== 'daily_streak_bonus')
                    .slice(0, 5)
                    .map(([key, rule]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{rule.label}</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-200">+{rule.coins}</Badge>
                      </div>
                    ))}
                </div>
              </motion.div>

              {/* Quick Stats + Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Activitate recenta</h2>
                </div>

                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Coins className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Inca nu ai activitate. Incepe sa explorezi proprietati!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {transactions.slice(0, 8).map((tx) => (
                        <TransactionRow key={tx.id} transaction={tx} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Featured Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Recompense populare
                </h2>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => document.querySelector('[data-value="magazin"]')?.dispatchEvent(new Event('click'))}>
                  Vezi toate <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COIN_REWARDS.slice(0, 3).map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={canAfford(reward.cost)}
                    balance={balance}
                    onRedeem={() => handleRedeem(reward)}
                  />
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Tab: Realizari ── */}
          <TabsContent value="realizari">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Realizarile tale
                </h2>
                <Badge variant="secondary">
                  {computedAchievements.filter((a) => a.unlockedAt).length} / {computedAchievements.length}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {computedAchievements.map((ach, i) => {
                  const styles = ACHIEVEMENT_TIER_STYLES[ach.tier]
                  const isUnlocked = !!ach.unlockedAt
                  return (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`relative rounded-xl border p-5 transition-all ${
                        isUnlocked
                          ? `${styles.bg} ${styles.border}`
                          : 'bg-card border-border/50 opacity-75'
                      }`}
                    >
                      {isUnlocked && (
                        <div className={`absolute top-3 right-3 rounded-full p-1 ${styles.iconBg}`}>
                          <Unlock className={`h-3.5 w-3.5 ${styles.text}`} />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isUnlocked ? styles.iconBg : 'bg-muted'
                        }`}>
                          {createElement(ACHIEVEMENT_ICON_MAP[ach.icon] ?? Star, {
                            className: `h-5 w-5 ${isUnlocked ? styles.text : 'text-muted-foreground'}`,
                          })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{ach.title}</h3>
                            <Badge variant="outline" className={`text-[10px] ${styles.text} ${styles.border}`}>
                              {styles.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {isUnlocked ? 'Deblocat!' : `${ach.progress} / ${ach.target}`}
                          </span>
                          {isUnlocked && (
                            <span className={`font-bold ${styles.text}`}>+{ach.reward} monede</span>
                          )}
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              isUnlocked
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                : 'bg-muted-foreground/30'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Provocari ── */}
          <TabsContent value="provocari">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Provocari saptamanale
                </h2>
                <Badge variant="secondary">
                  Saptamana {getWeekStart(new Date())}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {challenges.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`glass-card rounded-2xl p-5 ${ch.claimed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          ch.claimed
                            ? 'bg-emerald-100 dark:bg-emerald-950/30'
                            : ch.completed
                              ? 'bg-amber-100 dark:bg-amber-950/30'
                              : 'bg-muted'
                        }`}>
                          {createElement(ACHIEVEMENT_ICON_MAP[ch.icon] ?? Target, {
                            className: `h-5 w-5 ${
                              ch.claimed
                                ? 'text-emerald-600'
                                : ch.completed
                                  ? 'text-amber-600'
                                  : 'text-muted-foreground'
                            }`,
                          })}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{ch.title}</h3>
                          <p className="text-xs text-muted-foreground">{ch.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        +{ch.reward}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {ch.claimed ? 'Revendicat' : `${ch.current} / ${ch.target}`}
                        </span>
                        <span className="font-medium">
                          {Math.round((ch.current / ch.target) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            ch.claimed
                              ? 'bg-emerald-500'
                              : ch.completed
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                : 'bg-muted-foreground/30'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (ch.current / ch.target) * 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>

                    {ch.completed && !ch.claimed && (
                      <Button
                        size="sm"
                        className="w-full mt-3 gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
                        onClick={() => claimChallenge(ch)}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        Revendica +{ch.reward} monede
                      </Button>
                    )}
                    {ch.claimed && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium">
                        <Check className="h-4 w-4" />
                        Completat
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Clasament ── */}
          <TabsContent value="clasament">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                  <Medal className="h-5 w-5 text-amber-500" />
                  Top utilizatori
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Clasamentul celor mai activi utilizatori HQS
                </p>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2.5rem_1fr_6rem_5rem] gap-3 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <span>#</span>
                  <span>Utilizator</span>
                  <span className="text-right">Monede</span>
                  <span className="text-right">Streak</span>
                </div>
                <div className="divide-y divide-border/50">
                  {leaderboard.map((entry) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`grid grid-cols-[2.5rem_1fr_6rem_5rem] gap-3 px-5 py-3.5 items-center transition-colors ${
                        entry.isCurrentUser ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <span className={`text-sm font-bold ${
                        entry.rank === 1
                          ? 'text-amber-500'
                          : entry.rank === 2
                            ? 'text-slate-400'
                            : entry.rank === 3
                              ? 'text-orange-400'
                              : 'text-muted-foreground'
                      }`}>
                        {entry.rank <= 3 ? (
                          <Trophy className={`h-4 w-4 ${
                            entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-slate-400' : 'text-orange-400'
                          }`} />
                        ) : (
                          entry.rank
                        )}
                      </span>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          entry.isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {entry.initials}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-[10px]">Tu</Badge>
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-right tabular-nums">
                        {entry.balance.toLocaleString('ro-RO')}
                      </span>
                      <span className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                        <Flame className="h-3.5 w-3.5 text-orange-400" />
                        {entry.streak}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Magazin ── */}
          <TabsContent value="magazin">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-500" />
                  Magazin recompense
                </h2>
                <Badge variant="secondary" className="gap-1">
                  <Coins className="h-3.5 w-3.5" />
                  {balance} monede
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COIN_REWARDS.map((reward, i) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <RewardCard
                      reward={reward}
                      canAfford={canAfford(reward.cost)}
                      balance={balance}
                      onRedeem={() => handleRedeem(reward)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Istoric ── */}
          <TabsContent value="istoric">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Istoric tranzactii
              </h2>

              {transactions.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Coins className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Inca nu ai nicio tranzactie.</p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
                  <AnimatePresence initial={false}>
                    {transactions.map((tx) => (
                      <TransactionRow key={tx.id} transaction={tx} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
