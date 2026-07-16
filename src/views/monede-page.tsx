'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BellRing,
  CalendarCheck,
  Check,
  CircleDollarSign,
  Clock3,
  Coins,
  Flame,
  Gift,
  Heart,
  History,
  LogIn,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionRow, RewardCard } from '@/components/monede'
import { useAuth } from '@/contexts/auth-context'
import { COIN_EARN_RULES } from '@/lib/constants'
import type { CoinRedemption, CoinReward } from '@/lib/types'
import { useAppStore } from '@/store/use-app-store'

const EARN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  view_property: Search,
  favorite: Heart,
  contact_form: MessageSquare,
  book_viewing: CalendarCheck,
  complete_viewing: Check,
  newsletter: BellRing,
  add_property: Sparkles,
  save_search: Search,
  price_alert: BellRing,
}

const VERIFIED_EARN_ACTIONS = new Set([
  'view_property',
  'favorite',
  'book_viewing',
  'complete_viewing',
  'newsletter',
  'add_property',
])

const REDEMPTION_STATUS: Record<CoinRedemption['status'], { label: string; className: string }> = {
  REQUESTED: {
    label: 'În verificare',
    className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
  },
  FULFILLED: {
    label: 'Activată',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  REJECTED: {
    label: 'Respinsă',
    className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Anulată',
    className: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
}

function bucharestDate(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function MonedePage() {
  const { user, loading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)

  if (loading) return <MonedeLoading />
  if (!user) return <MonedeGuestState onLogin={() => navigateTo('login')} />
  return <MonedeAuthenticatedPage />
}

function MonedeLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/10">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Coins className="h-7 w-7 animate-pulse text-amber-500" />
        <span>Se încarcă portofelul securizat...</span>
      </div>
    </div>
  )
}

function MonedeGuestState({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 dots-pattern opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg rounded-3xl border bg-card/90 p-8 text-center shadow-xl backdrop-blur sm:p-12"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/20">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>
        <Badge variant="outline" className="mb-4 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
          Program de loialitate
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">HQS Monede</h1>
        <p className="mt-3 text-muted-foreground">
          Autentifică-te pentru a câștiga monede din activitatea verificată în platformă și pentru a solicita recompense.
        </p>
        <Button onClick={onLogin} className="mt-7 w-full gap-2 sm:w-auto">
          <LogIn className="h-4 w-4" />
          Autentifică-te
        </Button>
      </motion.div>
    </div>
  )
}

function MonedeAuthenticatedPage() {
  const {
    balance,
    lifetimeEarned,
    lifetimeSpent,
    transactions,
    rewards,
    redemptions,
    streak,
    coinsLoading,
    coinsError,
    claimDailyLogin,
    redeemReward,
    refreshCoins,
  } = useAppStore()
  const [tab, setTab] = useState('panou')
  const [claiming, setClaiming] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const claimedToday = streak.lastLoginDate === bucharestDate()
  const recentTransactions = transactions.slice(0, 6)
  const nextReward = useMemo(
    () => rewards.filter((reward) => reward.cost > balance).sort((a, b) => a.cost - b.cost)[0],
    [balance, rewards],
  )
  const nextRewardProgress = nextReward ? Math.min(100, (balance / nextReward.cost) * 100) : 100

  const handleClaimDaily = async () => {
    if (claiming || claimedToday) return
    setClaiming(true)
    try {
      const result = await claimDailyLogin()
      if (result.earned > 0) {
        toast.success(`+${result.earned} monede`, {
          description: result.streak % 3 === 0
            ? `Ai primit și bonusul pentru ${result.streak} zile consecutive.`
            : 'Recompensa zilnică a fost adăugată în portofel.',
        })
      }
    } catch (error) {
      toast.error('Recompensa zilnică nu a putut fi revendicată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setClaiming(false)
    }
  }

  const handleRedeem = async (reward: CoinReward): Promise<boolean> => {
    if (redeemingId || balance < reward.cost) return false
    setRedeemingId(reward.id)
    try {
      const redemption = await redeemReward(reward.id)
      if (!redemption) return false
      toast.success('Cererea de recompensă a fost înregistrată.', {
        description: `${reward.cost} monede au fost rezervate. Echipa HQS va verifica eligibilitatea și activarea.`,
      })
      return true
    } catch (error) {
      toast.error('Recompensa nu a putut fi solicitată.', {
        description: error instanceof Error ? error.message : undefined,
      })
      return false
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/15 pb-14">
      <section className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0 dots-pattern opacity-50" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/20">
                  <span className="font-extrabold text-white">HQS</span>
                </div>
                <div>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                    Portofel securizat
                  </Badge>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">HQS Monede</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Soldul și istoricul sunt legate de contul tău. Monedele se acordă o singură dată pentru acțiunile eligibile și nu pot fi modificate din browser.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-w-64 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/30 dark:to-yellow-950/20"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">Sold disponibil</p>
              <div className="mt-1 flex items-center gap-2">
                <CircleDollarSign className="h-7 w-7 text-amber-500" />
                <span className="text-4xl font-extrabold tabular-nums">{balance.toLocaleString('ro-RO')}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">monede HQS</p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {coinsError && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Portofelul nu s-a sincronizat.</p>
                <p className="text-sm opacity-80">{coinsError}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshCoins()} disabled={coinsLoading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${coinsLoading ? 'animate-spin' : ''}`} />
              Reîncearcă
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="space-y-7">
          <TabsList className="grid h-auto w-full grid-cols-3 p-1 sm:w-fit sm:min-w-[28rem]">
            <TabsTrigger value="panou" className="gap-2 py-2.5">
              <Coins className="h-4 w-4" />
              <span>Panou</span>
            </TabsTrigger>
            <TabsTrigger value="recompense" className="gap-2 py-2.5">
              <Gift className="h-4 w-4" />
              <span>Recompense</span>
            </TabsTrigger>
            <TabsTrigger value="istoric" className="gap-2 py-2.5">
              <History className="h-4 w-4" />
              <span>Istoric</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panou" className="space-y-7">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={TrendingUp} label="Total câștigat" value={lifetimeEarned} tone="emerald" />
              <StatCard icon={TrendingDown} label="Total utilizat" value={lifetimeSpent} tone="rose" />
              <StatCard icon={Flame} label="Streak curent" value={streak.currentStreak} suffix="zile" tone="amber" />
              <StatCard icon={ShoppingBag} label="Cereri recompense" value={redemptions.length} tone="violet" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <h2 className="font-semibold">Recompensa zilnică</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Revino zilnic. La fiecare 3 zile consecutive primești încă 10 monede bonus.
                    </p>
                  </div>
                  <Badge variant="secondary">{streak.currentStreak} zile</Badge>
                </div>
                <div className="mt-6 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Recompensa de astăzi</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">+5 monede</p>
                    </div>
                    <Button
                      onClick={() => void handleClaimDaily()}
                      disabled={claimedToday || claiming || coinsLoading || !!coinsError}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
                    >
                      {claimedToday ? <Check className="h-4 w-4" /> : <CircleDollarSign className={`h-4 w-4 ${claiming ? 'animate-spin' : ''}`} />}
                      {claimedToday ? 'Revendicată' : claiming ? 'Se verifică...' : 'Revendică'}
                    </Button>
                  </div>
                </div>
                {nextReward && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Până la „{nextReward.title}”</span>
                      <span className="font-medium">{balance} / {nextReward.cost}</span>
                    </div>
                    <Progress value={nextRewardProgress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Activitate recentă</h2>
                    <p className="text-xs text-muted-foreground">Ultimele modificări verificate ale soldului</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTab('istoric')}>Vezi istoricul</Button>
                </div>
                {recentTransactions.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {recentTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={History} title="Nicio tranzacție" description="Prima tranzacție va apărea după sincronizarea portofelului." />
                )}
              </div>
            </div>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold">Cum câștigi monede</h2>
                <p className="text-sm text-muted-foreground">Se aplică limite zilnice și protecție împotriva acordării duplicate.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(COIN_EARN_RULES)
                  .filter(([key]) => VERIFIED_EARN_ACTIONS.has(key))
                  .map(([key, rule]) => {
                    const Icon = EARN_ICONS[key] ?? Sparkles
                    return (
                      <div key={key} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                          <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{rule.label}</p>
                            <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">+{rule.coins}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{rule.description.replace(/^\+\d+ moned(e|a) pentru /, '')}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="recompense" className="space-y-7">
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-amber-600" />Recompense verificate de echipă</h2>
                <p className="mt-1 text-sm text-muted-foreground">Solicitarea rezervă monedele imediat; activarea se face după verificarea eligibilității.</p>
              </div>
              <Badge className="w-fit bg-amber-500 text-white">Sold: {balance} monede</Badge>
            </div>

            {rewards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={balance >= reward.cost}
                    balance={balance}
                    onRedeem={() => handleRedeem(reward)}
                    disabled={redeemingId !== null || coinsLoading || !!coinsError}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Gift} title="Catalog indisponibil" description="Recompensele vor apărea după sincronizarea cu serverul." />
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold">Cererile tale</h2>
              {redemptions.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {redemptions.map((redemption) => (
                    <RedemptionRow key={redemption.id} redemption={redemption} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
                  Nu ai solicitat încă nicio recompensă.
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="istoric" className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Istoric tranzacții</h2>
              <p className="text-sm text-muted-foreground">Registrul complet al monedelor câștigate și utilizate.</p>
            </div>
            {transactions.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm divide-y divide-border/50">
                {transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <EmptyState icon={History} title="Istoricul este gol" description="Acțiunile eligibile vor apărea aici automat." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = 'monede',
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  suffix?: string
  tone: 'emerald' | 'rose' | 'amber' | 'violet'
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  }
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('ro-RO')}</p>
      <p className="text-xs text-muted-foreground">{label} · {suffix}</p>
    </div>
  )
}

function RedemptionRow({ redemption }: { redemption: CoinRedemption }) {
  const status = REDEMPTION_STATUS[redemption.status]
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
        <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{redemption.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3 w-3" />
          {new Date(redemption.requestedAt).toLocaleDateString('ro-RO')}
          <span>· {redemption.cost} monede</span>
        </p>
      </div>
      <Badge variant="outline" className={status.className}>{status.label}</Badge>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/35" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
