'use client'

import { useState, createElement } from 'react'
import { motion } from 'framer-motion'
import {
  CircleDollarSign,
  Check,
  Coins,
  Star,
  Sparkles,
  Headphones,
  FileBarChart2,
  Ticket,
  TicketPercent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CoinReward } from '@/lib/types'

const REWARD_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Sparkles,
  Headphones,
  FileBarChart2,
  Ticket,
  TicketPercent,
}

const CATEGORY_LABELS: Record<string, string> = {
  listing: 'Anunt',
  service: 'Serviciu',
  discount: 'Reducere',
}

const CATEGORY_STYLES: Record<string, string> = {
  listing:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  service:
    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-300 dark:border-violet-700',
  discount:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
}

interface RewardCardProps {
  reward: CoinReward
  canAfford: boolean
  balance: number
  onRedeem: () => void
}

export function RewardCard({ reward, canAfford, balance, onRedeem }: RewardCardProps) {
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
        ...(justRedeemed ? { scale: [1, 1.05, 1], transition: { duration: 0.5 } } : {}),
      }}
      className={`relative flex flex-col rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${
        justRedeemed ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            {createElement(REWARD_ICON_MAP[reward.icon] ?? CircleDollarSign, {
              className: 'h-5 w-5 text-amber-600 dark:text-amber-400',
            })}
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
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {reward.description}
        </p>
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
        {canAfford ? (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              className="w-full h-9 gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 text-xs font-semibold"
              onClick={handleRedeem}
              disabled={redeeming || justRedeemed}
            >
              {redeeming ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Coins className="h-3.5 w-3.5" />
                </motion.div>
              ) : justRedeemed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <CircleDollarSign className="h-3.5 w-3.5" />
              )}
              {redeeming ? 'Se proceseaza...' : justRedeemed ? 'Redemat!' : `Redeema — ${reward.cost} monede`}
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
            Nu ai suficiente ({deficit} in plus)
          </Button>
        )}
      </div>
    </motion.div>
  )
}
